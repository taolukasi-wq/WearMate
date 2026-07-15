import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import COS from 'cos-nodejs-sdk-v5';
import { GoogleGenAI, Type } from '@google/genai';
import { UserProfile } from './src/types';

// Load environment variables
dotenv.config();

// Simple in-memory user store backed by data/users.json
interface UserRecord extends UserProfile {
  id: string;
  password: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

// Tencent Cloud COS configuration
const COS_SECRET_ID = process.env.COS_SECRET_ID;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
const COS_REGION = process.env.COS_REGION;
const COS_BUCKET = process.env.COS_BUCKET;

const cosEnabled = !!(COS_SECRET_ID && COS_SECRET_KEY && COS_REGION && COS_BUCKET);
const cos = cosEnabled
  ? new COS({
      SecretId: COS_SECRET_ID,
      SecretKey: COS_SECRET_KEY,
    })
  : null;

function getCosPublicUrl(key: string): string {
  return `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;
}

let users: UserRecord[] = [];
const sessions = new Map<string, string>(); // token -> userId

async function saveImage(
  userId: string,
  type: 'closet' | 'profile' | 'output',
  imageData: string
): Promise<{ filePath: string; relativePath: string }> {
  let base64Data = imageData;
  let ext = 'jpg';
  let contentType = 'image/jpeg';

  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      base64Data = matches[2];
      ext = mimeType === 'image/png' ? 'png' : 'jpg';
      contentType = mimeType;
    }
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${timestamp}-${random}.${ext}`;
  const key = `images/${userId}/${type}/${fileName}`;

  if (cos && COS_BUCKET && COS_REGION) {
    await cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Body: Buffer.from(base64Data, 'base64'),
      ContentType: contentType,
    });
    return {
      filePath: key,
      relativePath: getCosPublicUrl(key),
    };
  }

  // Fallback to local filesystem when COS is not configured
  const userDir = path.join(IMAGES_DIR, userId, type);
  await fs.mkdir(userDir, { recursive: true });
  const filePath = path.join(userDir, fileName);
  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

  return {
    filePath,
    relativePath: `/images/${userId}/${type}/${fileName}`,
  };
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  // Handle relative paths by resolving against the local server
  const url = imageUrl.startsWith('http')
    ? imageUrl
    : `http://localhost:${process.env.PORT || 3000}${imageUrl}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

async function loadUsers(): Promise<void> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    users = JSON.parse(data);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      users = [];
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    } else {
      console.error('Failed to load users.json:', err);
      users = [];
    }
  }
}

async function saveUsers(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeUser(user: UserRecord): UserProfile {
  const { password, ...profile } = user;
  return profile;
}

function getLanguageInstruction(language?: string): string {
  return language === 'zh-CN' || language === 'zh'
    ? '请用中文（简体）回答。所有文本字段（name 单品名称、brand 品牌、material 材质、color 颜色、curationTitle1/2 策展标题、curationContent1/2 策展内容）都必须是中文。category 字段值必须是 tops、bottoms、shoes、accessories 之一，不要翻译。'
    : 'Please respond in English. All text fields (name, brand, material, color, curationTitle1/2, curationContent1/2) must be in English. The category field must be one of: tops, bottoms, shoes, accessories.';
}

function getItemScanSchema(language?: string) {
  const isZh = language === 'zh-CN' || language === 'zh';
  return {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: isZh
          ? '单品的中文描述名称，例如：结构化粗花呢夹克、真丝吊带裙、小牛皮乐福鞋。'
          : 'The descriptive product name of the item, e.g. Structured Tweed Jacket, Silk Slip Dress, Calfskin Loafers.',
      },
      brand: {
        type: Type.STRING,
        description: isZh
          ? '推荐一个与该风格匹配的奢侈或时尚品牌中文名称（若无法识别可用英文原名），例如：思琳、普拉达、The Row、圣罗兰。'
          : 'Suggest a luxury or fashion-forward brand that matches this style (e.g. Theory, Celine, The Row, Prada, Saint Laurent, Gucci, etc.) if not clearly visible.',
      },
      category: {
        type: Type.STRING,
        description: isZh
          ? '必须是以下之一：tops（上装）、bottoms（下装）、shoes（鞋履）、accessories（配饰）。返回值只能是 tops、bottoms、shoes、accessories 之一。'
          : 'Must be one of: tops, bottoms, shoes, accessories.',
      },
      material: {
        type: Type.STRING,
        description: isZh
          ? '材质或面料成分中文，例如：100% 初剪羊毛、高级真丝双绉、Togo 小牛皮、日本丹宁。'
          : 'The likely material or fabric composition, e.g. 100% Virgin Wool, Premium Silk Crepe, Togo Leather, Japanese Denim.',
      },
      color: {
        type: Type.STRING,
        description: isZh
          ? '单品主色调中文名称，例如：海军蓝、象牙白、驼色。'
          : 'The primary color of the item.',
      },
      colorHex: {
        type: Type.STRING,
        description: 'A 6-character hex code representing the primary color, e.g., #121367.',
      },
      curationTitle1: {
        type: Type.STRING,
        description: isZh
          ? '中文策展标题，例如：完美同色系搭配、利落商务休闲风。'
          : 'A styling/curation headline note, e.g., Perfect tonal pairing, Smart business casual.',
      },
      curationContent1: {
        type: Type.STRING,
        description: isZh
          ? '1-2 句中文详细造型洞察，说明该单品为何出彩以及最适合搭配什么质感。'
          : 'A 1-2 sentence detailed styling insight explaining why this item works well and what textures it pairs best with.',
      },
      curationTitle2: {
        type: Type.STRING,
        description: isZh
          ? '中文场景/天气适配标题，例如：20°C 通勤理想选择、夜晚叠穿利器。'
          : 'A weather/context suitability headline, e.g., Premium 20°C transition, Ideal evening layering.',
      },
      curationContent2: {
        type: Type.STRING,
        description: isZh
          ? '1-2 句中文详细说明，解释哪些天气条件或场合最适合这件单品。'
          : 'A 1-2 sentence detailed insight explaining which weather conditions or occasions are perfect for this item.',
      },
    },
    required: [
      'name',
      'brand',
      'category',
      'material',
      'color',
      'colorHex',
      'curationTitle1',
      'curationContent1',
      'curationTitle2',
      'curationContent2',
    ],
  };
}

function getProfileScanSchema(language?: string) {
  const isZh = language === 'zh-CN' || language === 'zh';
  return {
    type: Type.OBJECT,
    properties: {
      skinTone: {
        type: Type.STRING,
        description: isZh
          ? '中文肤色描述，例如：冷象牙色、暖沙色、金蜜色、深可可色、橄榄色。'
          : 'Skin tone description, e.g. Cool Ivory, Warm Sand, Golden Honey, Rich Walnut, Deep Cocoa, Olive.',
      },
      skinToneColor: {
        type: Type.STRING,
        description: 'A single representative Hex color code for this skin tone, e.g., #F5E6DA.',
      },
      bodyType: {
        type: Type.STRING,
        description: isZh
          ? '中文体型描述，例如：沙漏型、矩形身材、梨形身材、运动型、倒三角型。'
          : 'Suggested body type shape, e.g., Hourglass, Rectangle, Pear, Athletic, Inverted Triangle.',
      },
      recommendationPaletteName: {
        type: Type.STRING,
        description: isZh
          ? '中文配色主题名称，例如： pastel 冷调、大地暖调、浓郁宝石色调。'
          : 'A theme name for the palette, e.g. Pastel & Cool Tones, Earthy & Warm Tones, Vibrant Jewel Tones.',
      },
      recommendationDescription: {
        type: Type.STRING,
        description: isZh
          ? '2 句中文说明，解释为什么这些颜色适合该肤色底调。'
          : 'A short 2-sentence explanation of why these colors suit their skin tone undertone.',
      },
      paletteColors: {
        type: Type.ARRAY,
        description: isZh
          ? '5 种能衬托其特征的中文精选色。'
          : 'A highly curated set of exactly 5 colors that enhance their features.',
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: isZh
                ? '中文颜色名称，例如：鼠尾草绿、米白色、浅灰色。'
                : 'Descriptive color name, e.g., Sage Green, Off White, Light Gray.',
            },
            hex: {
              type: Type.STRING,
              description: 'The 6-character color hex code, e.g., #A5C9CA.',
            },
          },
          required: ['name', 'hex'],
        },
      },
    },
    required: [
      'skinTone',
      'skinToneColor',
      'bodyType',
      'recommendationPaletteName',
      'recommendationDescription',
      'paletteColors',
    ],
  };
}

// Create Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
}

async function startServer() {
  await loadUsers();

  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for base64 images
  app.use(express.json({ limit: '10mb' }));

  // API Route: Scan an item image to extract fashion specifications
  app.post('/api/scan-item', async (req: Request, res: Response): Promise<void> => {
    try {
      const { image, userId, language } = req.body;
      if (!image) {
        res.status(400).json({ error: 'Missing image parameter.' });
        return;
      }

      let savedImagePath: string | undefined;
      if (userId) {
        const saved = await saveImage(userId, 'closet', image);
        savedImagePath = saved.relativePath;
      }

      if (!ai) {
        res.status(500).json({ error: 'Gemini API client is not initialized.', savedImagePath });
        return;
      }

      // Extract pure base64 data and mimeType
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const prompt = `Analyze this clothing or fashion item image. Extract its key attributes and provide high-fashion WearMate style curation notes. ${getLanguageInstruction(language)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: getItemScanSchema(language),
        },
      });

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText);
      if (savedImagePath) {
        result.savedImagePath = savedImagePath;
      }
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/scan-item:', error);
      res.status(500).json({ error: error.message || 'Failed to scan item.' });
    }
  });

  // API Route: Analyze personal aesthetics (skin tone, undertone, body shape) from a selfie or photo
  app.post('/api/analyze-profile', async (req: Request, res: Response): Promise<void> => {
    try {
      const { image, userId, language } = req.body;
      if (!image) {
        res.status(400).json({ error: 'Missing image parameter.' });
        return;
      }

      let savedImagePath: string | undefined;
      if (userId) {
        const saved = await saveImage(userId, 'profile', image);
        savedImagePath = saved.relativePath;
      }

      if (!ai) {
        res.status(500).json({ error: 'Gemini API client is not initialized.', savedImagePath });
        return;
      }

      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const prompt = `Analyze this person's portrait or photo to detect skin tone undertone and general body shape. Suggest a highly curated high-contrast cool or warm palette. If the image is not a person, simulate a high-quality styling persona (Cool Ivory & Hourglass). ${getLanguageInstruction(language)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: getProfileScanSchema(language),
        },
      });

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText);
      if (savedImagePath) {
        result.savedImagePath = savedImagePath;
      }
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/analyze-profile:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze profile.' });
    }
  });

  // API Route: Mix & Match items to generate a smart outfit recommendation
  app.post('/api/mix-match-outfit', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!ai) {
        res.status(500).json({ error: 'Gemini API client is not initialized.' });
        return;
      }

      const { items, scenario, userProfile, language } = req.body;
      const scenarioText = scenario || 'Commute';

      const itemsDescription = items
        ?.map((it: any) => `- ${it.brand} ${it.name} (${it.category}, ${it.material}, Color: ${it.color})`)
        .join('\n') || 'None';

      const prompt = `You are the lead AI Personal Stylist for WearMate, a luxury digital fashion wardrobing application.
We want to curate a gorgeous styled ensemble for a "${scenarioText}" scenario using a selection of the following closet items:
${itemsDescription}

User Profile details:
- Skin Tone: ${userProfile?.skinTone || 'Cool Ivory'}
- Body Type: ${userProfile?.bodyType || 'Hourglass'}

Design a curated outfit name, set the perfect temperature suitability, and write 2 highly professional, fashion-forward AI Curation notes. ${getLanguageInstruction(language)}
The first note must relate to styling cohesiveness or skin-tone suitability.
The second note must relate to weather adaptability and practical lifestyle elegance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              outfitName: {
                type: Type.STRING,
                description: 'A chic, editorial name for this outfit, e.g., Urban Refinement, Effortless Academic, Minimalist Solstice.',
              },
              tempPerfect: {
                type: Type.STRING,
                description: 'The ideal temperature condition, e.g., 20°C Perfect, 18°C Comfort, 24°C Airy.',
              },
              note1Title: {
                type: Type.STRING,
                description: 'A compelling title for the styling/skin tone notes, e.g., Enhances Your undertones.',
              },
              note1Content: {
                type: Type.STRING,
                description: 'Detailed analysis (2-3 sentences) of how these items harmonize together and suit their features.',
              },
              note1Icon: {
                type: Type.STRING,
                description: 'Material Symbol icon name to use (e.g. palette, auto_awesome, checkroom).',
              },
              note2Title: {
                type: Type.STRING,
                description: 'A compelling title for weather/practicality, e.g., Perfect for Transition Weather.',
              },
              note2Content: {
                type: Type.STRING,
                description: 'Detailed analysis (2-3 sentences) of why this outfit is comfortable, smart, and adaptable for the scenario.',
              },
              note2Icon: {
                type: Type.STRING,
                description: 'Material Symbol icon name to use (e.g. cloud_queue, thermostat, local_shipping, school).',
              },
            },
            required: [
              'outfitName',
              'tempPerfect',
              'note1Title',
              'note1Content',
              'note1Icon',
              'note2Title',
              'note2Content',
              'note2Icon',
            ],
          },
        },
      });

      const responseText = response.text || '{}';
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error('Error in /api/mix-match-outfit:', error);
      res.status(500).json({ error: error.message || 'Failed to mix and match outfit.' });
    }
  });

  // Auth Routes

  // Register a new user
  app.post('/api/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email and password are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const newUser: UserRecord = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        avatar: '',
        skinTone: 'Cool Ivory',
        skinToneColor: '#F5E6DA',
        bodyType: 'Hourglass',
        recommendationColors: [
          { name: 'Sage Green', hex: '#A5C9CA' },
          { name: 'Off White', hex: '#E7F6F2' },
          { name: 'Light Gray', hex: '#D8D8D8' },
          { name: 'Mid Gray', hex: '#B2B2B2' },
          { name: 'Slate Gray', hex: '#395B64' },
        ],
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      await saveUsers();

      const token = generateToken();
      sessions.set(token, newUser.id);

      res.status(201).json({ token, user: sanitizeUser(newUser) });
    } catch (error: any) {
      console.error('Error in /api/register:', error);
      res.status(500).json({ error: error.message || 'Failed to register user.' });
    }
  });

  // Login an existing user
  app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.password === password);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const token = generateToken();
      sessions.set(token, user.id);

      res.json({ token, user: sanitizeUser(user) });
    } catch (error: any) {
      console.error('Error in /api/login:', error);
      res.status(500).json({ error: error.message || 'Failed to log in.' });
    }
  });

  // Logout the current user
  app.post('/api/logout', (req: Request, res: Response): void => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    if (token) {
      sessions.delete(token);
    }
    res.json({ success: true });
  });

  // Get current authenticated user
  app.get('/api/me', (req: Request, res: Response): void => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const userId = sessions.get(token)!;
    const user = users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  });

  // API Route: Upload a frontal face photo for virtual try-on
  app.post('/api/upload-profile-photo', async (req: Request, res: Response): Promise<void> => {
    try {
      const { image, userId } = req.body;
      if (!image) {
        res.status(400).json({ error: 'Missing image parameter.' });
        return;
      }
      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter.' });
        return;
      }

      const saved = await saveImage(userId, 'profile', image);
      res.json({ profilePhotoPath: saved.relativePath });
    } catch (error: any) {
      console.error('Error in /api/upload-profile-photo:', error);
      res.status(500).json({ error: error.message || 'Failed to upload profile photo.' });
    }
  });

  // API Route: Generate an outfit visualization using Nano Banana 2 Lite
  app.post('/api/generate-outfit-visual', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!ai) {
        res.status(500).json({ error: 'Gemini API client is not initialized.' });
        return;
      }

      const { userId, profilePhoto, topImage, bottomImage, shoesImage, prompt, language } = req.body;
      if (!userId || !profilePhoto) {
        res.status(400).json({ error: 'Missing userId or profilePhoto parameter.' });
        return;
      }
      if (!topImage && !bottomImage && !shoesImage) {
        res.status(400).json({ error: 'At least one clothing image is required.' });
        return;
      }

      const imageParts: any[] = [];
      const clothingDesc: string[] = [];

      async function pushImagePart(imageSrc: string | undefined, label: string) {
        if (!imageSrc) return;
        let imageData = imageSrc;
        // Fetch remote/local images and convert to base64 data URL
        if (imageSrc.startsWith('http') || imageSrc.startsWith('/images/')) {
          imageData = await fetchImageAsBase64(imageSrc);
        }
        let mimeType = 'image/jpeg';
        let base64Data = imageData;
        const matches = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
        imageParts.push({
          inlineData: { mimeType, data: base64Data },
        });
        clothingDesc.push(label);
      }

      await pushImagePart(profilePhoto, 'the person wearing the outfit');
      await pushImagePart(topImage, 'top garment');
      await pushImagePart(bottomImage, 'bottom garment');
      await pushImagePart(shoesImage, 'shoes');

      const defaultPrompt = `Create a realistic full-body outfit visualization. The person in the first photo is wearing the clothing items shown in the following reference images: ${clothingDesc.join(', ')}. Preserve the person's face, pose, and lighting. Make the outfit look natural and well-fitted. ${getLanguageInstruction(language)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: [
          ...imageParts,
          prompt || defaultPrompt,
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
        },
      });

      let generatedImageBase64: string | null = null;
      let generatedImageMimeType = 'image/png';

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data || null;
          generatedImageMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }

      if (!generatedImageBase64) {
        res.status(500).json({ error: 'No image was generated by the model.' });
        return;
      }

      const dataUrl = `data:${generatedImageMimeType};base64,${generatedImageBase64}`;
      const saved = await saveImage(userId, 'output', dataUrl);
      res.json({ outputImagePath: saved.relativePath });
    } catch (error: any) {
      console.error('Error in /api/generate-outfit-visual:', error);
      res.status(500).json({ error: error.message || 'Failed to generate outfit visualization.' });
    }
  });

  // Static file serving fallback for locally stored images (only when COS is disabled)
  if (!cosEnabled) {
    app.use('/images', express.static(IMAGES_DIR));
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', geminiEnabled: !!ai, cosEnabled });
  });

  // Vite integration / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WearMate Backend] Running on http://localhost:${PORT}`);
  });
}

startServer();
