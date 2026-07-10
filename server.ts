import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
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

let users: UserRecord[] = [];
const sessions = new Map<string, string>(); // token -> userId

async function saveImage(
  userId: string,
  type: 'closet' | 'profile',
  imageData: string
): Promise<{ filePath: string; relativePath: string }> {
  const userDir = path.join(IMAGES_DIR, userId, type);
  await fs.mkdir(userDir, { recursive: true });

  let base64Data = imageData;
  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (matches && matches.length === 3) {
      base64Data = matches[2];
    }
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `${timestamp}-${random}.jpg`;
  const filePath = path.join(userDir, fileName);

  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

  return {
    filePath,
    relativePath: `/images/${userId}/${type}/${fileName}`,
  };
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
      const { image, userId } = req.body;
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

      const prompt = `Analyze this clothing or fashion item image. Extract its key attributes and provide high-fashion digital atelier style curation notes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: 'The descriptive product name of the item, e.g. Structured Tweed Jacket, Silk Slip Dress, Calfskin Loafers.',
              },
              brand: {
                type: Type.STRING,
                description: 'Suggest a luxury or fashion-forward brand that matches this style (e.g. Theory, Celine, The Row, Prada, Saint Laurent, Gucci, etc.) if not clearly visible.',
              },
              category: {
                type: Type.STRING,
                description: 'Must be one of: tops, bottoms, shoes, accessories.',
              },
              material: {
                type: Type.STRING,
                description: 'The likely material or fabric composition, e.g. 100% Virgin Wool, Premium Silk Crepe, Togo Leather, Japanese Denim.',
              },
              color: {
                type: Type.STRING,
                description: 'The primary color of the item.',
              },
              colorHex: {
                type: Type.STRING,
                description: 'A 6-character hex code representing the primary color, e.g., #121367.',
              },
              curationTitle1: {
                type: Type.STRING,
                description: 'A styling/curation headline note, e.g., Perfect tonal pairing, Smart business casual.',
              },
              curationContent1: {
                type: Type.STRING,
                description: 'A 1-2 sentence detailed styling insight explaining why this item works well and what textures it pairs best with.',
              },
              curationTitle2: {
                type: Type.STRING,
                description: 'A weather/context suitability headline, e.g., Premium 20°C transition, Ideal evening layering.',
              },
              curationContent2: {
                type: Type.STRING,
                description: 'A 1-2 sentence detailed insight explaining which weather conditions or occasions are perfect for this item.',
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
          },
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
      const { image, userId } = req.body;
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

      const prompt = `Analyze this person's portrait or photo to detect skin tone undertone and general body shape. Suggest a highly curated high-contrast cool or warm palette. If the image is not a person, simulate a high-quality styling persona (Cool Ivory & Hourglass).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, prompt],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skinTone: {
                type: Type.STRING,
                description: 'Skin tone description, e.g. Cool Ivory, Warm Sand, Golden Honey, Rich Walnut, Deep Cocoa, Olive.',
              },
              skinToneColor: {
                type: Type.STRING,
                description: 'A single representative Hex color code for this skin tone, e.g., #F5E6DA.',
              },
              bodyType: {
                type: Type.STRING,
                description: 'Suggested body type shape, e.g., Hourglass, Rectangle, Pear, Athletic, Inverted Triangle.',
              },
              recommendationPaletteName: {
                type: Type.STRING,
                description: 'A theme name for the palette, e.g. Pastel & Cool Tones, Earthy & Warm Tones, Vibrant Jewel Tones.',
              },
              recommendationDescription: {
                type: Type.STRING,
                description: 'A short 2-sentence explanation of why these colors suit their skin tone undertone.',
              },
              paletteColors: {
                type: Type.ARRAY,
                description: 'A highly curated set of exactly 5 colors that enhance their features.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Descriptive color name, e.g., Sage Green, Ochre, Coral.' },
                    hex: { type: Type.STRING, description: 'The 6-character color hex code, e.g., #A5C9CA.' },
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
          },
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

      const { items, scenario, userProfile } = req.body;
      const scenarioText = scenario || 'Commute';

      const itemsDescription = items
        ?.map((it: any) => `- ${it.brand} ${it.name} (${it.category}, ${it.material}, Color: ${it.color})`)
        .join('\n') || 'None';

      const prompt = `You are the lead AI Personal Stylist for DigitalAtelier, a luxury digital fashion wardrobing application.
We want to curate a gorgeous styled ensemble for a "${scenarioText}" scenario using a selection of the following closet items:
${itemsDescription}

User Profile details:
- Skin Tone: ${userProfile?.skinTone || 'Cool Ivory'}
- Body Type: ${userProfile?.bodyType || 'Hourglass'}

Design a curated outfit name, set the perfect temperature suitability, and write 2 highly professional, fashion-forward AI Curation notes.
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

  // Static file serving for user-uploaded images
  app.use('/images', express.static(IMAGES_DIR));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', geminiEnabled: !!ai });
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
    console.log(`[DigitalAtelier Backend] Running on http://localhost:${PORT}`);
  });
}

startServer();
