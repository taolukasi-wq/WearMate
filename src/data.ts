import { Item, Outfit, UserProfile } from './types';
import { Language } from './i18n/types';

const EN_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Ivory Silk Blouse',
    brand: 'Celine',
    category: 'tops',
    material: '100% Silk Crepe',
    color: 'Ivory',
    colorHex: '#FDFCFA',
    size: 'FR 36',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuxnABRBD3uvwg517Zs9XLWg224A2QKsv4dCjM2bIiH3XZAnV7gzEQtR6Z_4JhFiCnpjpPoLUgeg_mi8RBPVcGzOkj2Me5AVs7fmQHuP7LlHKu-jAY6lIr9tUUoGfXj6pQM_l4_l-JJZMH9Ff-RR9egsPwziCm-eClUq9LMP0c3HeMxkIKjOUNnpzP3y3jFESqXcuwtOUWTXWk2H5VNe_bIDCHG2PM2S6qbolh0OuC-DDUEEYP3eU',
    isFavorite: true,
  },
  {
    id: '2',
    name: 'Navy Wool Blazer',
    brand: 'The Row',
    category: 'tops',
    material: '100% Virgin Wool',
    color: 'Navy',
    colorHex: '#121367',
    size: 'IT 48',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3WiiSvG6PAN4mcI9K0bg5JdFYkE-x4LkSaThH7bQ-yMdxdQVq9JxV4QSD2IlWUL22oaU95Rc0bkPHRQKaIuECZTLk5trJn_TK_rbVEyZoW4o0spoiAjQLWOByV8kJ_1n5p73bCk32ylriNvqkkM2IwDBv_t-7UdFgyffnniQ7NTjFD6tpYjtb5sqBJSD0e8zHdrcYP7GyPT6df6xIWWCxkie4SXXO6SU-FoKdJiTCSH2d7WQCH_4',
    isFavorite: true,
  },
  {
    id: '3',
    name: 'Charcoal Trousers',
    brand: 'Prada',
    category: 'bottoms',
    material: 'Italian Crepe Wool',
    color: 'Charcoal',
    colorHex: '#3A3B3C',
    size: 'IT 46',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZwVM0bjjiwdTXAbM3B8CKIw-EIj-Ef1dDNCY80Tb3Z6WdaZ75lLHH6nZy9wDIYQgURULTXPXXBE6P1u-VUhBapDDpuFExiaJlF-Z3jfyu7pyoMHDdzbyBzMiTc9SMxuofw1WB8bHPEqleN3SAczb5BK97ZpvyFVjVOn_ZqaKcXBFBeEApfe71eatVBgqAw5ToIlpXT83r0g7jyXkNS8CHTdHOwPyetEqa5LsjG3jO3xaMq4ULJbg',
    isFavorite: false,
  },
  {
    id: '4',
    name: 'Leather Heels',
    brand: 'Saint Laurent',
    category: 'shoes',
    material: 'Patent Leather',
    color: 'Mahogany',
    colorHex: '#4A1D1A',
    size: 'EU 38',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFa9zBYOFR7Kit7_1lx00nmnP8mKt9H1qflj5Ug0SoTjSJijMmZ9up6Ww-MhWexX3mEIZe87fbBLHDmdY_wdRaI3NcbdwtglvEoRJaMVfwtr_uvLp7ZKRXeixrwSKcvLqoASIITmlvfHcXZ3GhOSs4Yb2VJT35B4HjY8xSRo4VlOfs1u2M7f1pEYDA94U4Q6e9TnOkVyrDndHyT8A87ZRwKwbk6qCZ6r7-Jhe8Q3qw3v1KApWBqoI',
    isFavorite: true,
  },
  {
    id: '5',
    name: 'Belted Handbag',
    brand: 'Hermès',
    category: 'accessories',
    material: 'Togo Leather',
    color: 'Black',
    colorHex: '#000000',
    size: '25cm',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0IHuUvYSD9miBU2WFFMWF1p0fgbpuzRbs56BtqaxP_IxsG0cfrkJouN9jWXZ2cEOMkGtsPjdMhTF1pZGBRSM4Q7YQbkkA14DsXOhxkq4Wob_nsHNVV2OkMu-tw4jLoKBnR6KaZ7DzmJlfMfopN7QgB3FquznkZdEkT451Y2wSF9iI9OWlu2bQs6hBIrxtuZIuAPJs6DnscFj5YiaAeT9tx7zj7QYgdN5IzuZMRRTWXrzHC7tsoyQ',
    isFavorite: false,
  },
  {
    id: '6',
    name: 'Linen Trousers',
    brand: 'Loro Piana',
    category: 'bottoms',
    material: '100% Organic Linen',
    color: 'White',
    colorHex: '#FFFFFF',
    size: 'IT 40',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCj7IJSPLc5BstqHSeKBGHh5YT0Lb0HlVHRcs4RqQPVzk-j0tyhi1uxVqUfjoEDdz94dDJKr1MkS9exkY5n4cSDKiEeWMwW4OonFoO-aGOFXUfNuQa7LvHrDoPrVka09CjeSNoX2dwNHIZUGjR6U2r5ZO3Nn1sn1rgbKizVYrfEdRy1HZgzyNRuZ1hLAqtdnElLaVa3owva-wxBF72R-d9E6pbpJXQhHZvhvnFLQfwBrqUsyOjBcw',
    isFavorite: false,
  },
  {
    id: '7',
    name: 'Silk Camisole',
    brand: 'La Perla',
    category: 'tops',
    material: 'Pure Mulberry Silk',
    color: 'Cream',
    colorHex: '#FFFDD0',
    size: 'S',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDks6F2iQsrKy1YW4pUe4MCVVNBHZy8mt9LijArdmtvfNprxnBElO32qswhJMDwjHuOlNXnA1ip43tFjLnCEzXn1xz24r153naP-hhtZFFc2x5AMb4N7eK1A1VdpG1PMM5KHjm9s5U0qDXWbUxQgxoRcbTOuT8VhwYakmODYuuDnBNPaIhGMG4u_S0NZeuPkun3npmePQ1c5pYQbnGkZUSn5H5VOHV4lWiC3qv0ycDOFX1Utr_T1NM',
    isFavorite: true,
  },
  {
    id: '8',
    name: 'Black Loafers',
    brand: 'Gucci',
    category: 'shoes',
    material: 'Calfskin Leather',
    color: 'Black',
    colorHex: '#000000',
    size: 'EU 41',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgdz_2t27DIk3NQ16p8zVCtOznH_J0AcVIGwtvEApmjwt7WJhzFvT9x0XB9Iet59Vz8mtRPXNvc0h1oLLDSN1NVOwBZ_bgV2nT4H52S4p87-IYM3zorF0XBVDpH4Jp_rKGkJdS2TJSti8EB0oXK8EJ_WHX2IYVfIczlxKwU-ciHVSJ_fkmfHmw5l2Dv-tIuVMD21VeZvL3PeV1Q7fqDqaK5sX-h5qyS-BM_4hDikdBdmOapMZEUTI',
    isFavorite: false,
  },
  {
    id: '9',
    name: 'Straight Denim',
    brand: "Levi's Made & Crafted",
    category: 'bottoms',
    material: 'Premium Japanese Denim',
    color: 'Light Wash',
    colorHex: '#A2C2E8',
    size: 'W 30 / L 32',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4RGYdfHU13v4-E19q3rHk9s3bRlTsYT6-cs4GU52fl0PKWkBRDlU86hdoUmTAi-3wG8EvmaXSBQzSJwuYEFgAF227N5Tgt-vJuRYtSZUw7JK6VGbPhdZEW_o5EXHRFBYxv7zRKcd25u4IoPO2RfKpQC8LiPSY7xW00bbU53IJmsG0hFGrzU1sBreDdP74eELmQ1cvrv17mdJQLMcRweDoJrIeeG1nmmgao26d0xlwW_pRXzyQZ9c',
    isFavorite: true,
  }
];

const ZH_ITEMS: Item[] = [
  { ...EN_ITEMS[0], name: '象牙白丝绸衬衫', color: '象牙白' },
  { ...EN_ITEMS[1], name: '海军蓝羊毛西装', color: '海军蓝' },
  { ...EN_ITEMS[2], name: '炭灰色长裤', color: '炭灰' },
  { ...EN_ITEMS[3], name: '皮革高跟鞋', color: '桃花心木棕' },
  { ...EN_ITEMS[4], name: '腰带手提包', color: '黑色' },
  { ...EN_ITEMS[5], name: '亚麻长裤', color: '白色' },
  { ...EN_ITEMS[6], name: '丝绸吊带背心', color: '奶油色' },
  { ...EN_ITEMS[7], name: '黑色乐福鞋', color: '黑色' },
  { ...EN_ITEMS[8], name: '直筒牛仔', color: '浅色水洗' },
];

export function getInitialItems(language: Language): Item[] {
  return language === 'zh-CN' ? ZH_ITEMS : EN_ITEMS;
}

export const INITIAL_ITEMS: Item[] = EN_ITEMS;

const EN_USER: UserProfile = {
  name: 'Julian',
  email: 'julian@digitalatelier.com',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQBHHAeaFD8nv2PFnW1tqz8kNKXf22WX3tNvkeQaSm1Q8_3f6D84wu-kwTJvUOJr70w9cl_FGKtcwRqxKQGEd6WmrEQWOrEkUJm-i93C2jgwN-_K9QDWT30K7UwvSrnYPRhhi1molrdNoQllK5ywseT5FlRsTpN2qJGJgUb-2J1VtKSRGGhlU5jW6Np1j4wWPCq-cxfgfD0syO8-h5xEdYHRx64z6VEhN6mjfe3e4NCHauTkWD6kc',
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
};

const ZH_USER: UserProfile = {
  ...EN_USER,
  name: '朱利安',
  skinTone: '冷象牙色',
  bodyType: '沙漏型',
  recommendationColors: [
    { name: '鼠尾草绿', hex: '#A5C9CA' },
    { name: '米白色', hex: '#E7F6F2' },
    { name: '浅灰色', hex: '#D8D8D8' },
    { name: '中灰色', hex: '#B2B2B2' },
    { name: '岩板灰', hex: '#395B64' },
  ],
};

export function getInitialUser(language: Language): UserProfile {
  return language === 'zh-CN' ? ZH_USER : EN_USER;
}

export const INITIAL_USER: UserProfile = EN_USER;

function makeOutfits(language: Language): Outfit[] {
  const isZh = language === 'zh-CN';
  const items = isZh ? ZH_ITEMS : EN_ITEMS;
  const outfitNames = {
    commute: isZh ? '都市精致' : 'Urban Refinement',
    date: isZh ? '午夜优雅' : 'Midnight Elegance',
    casual: isZh ? '现代学院风' : 'Modern Academic',
  };
  const tempLabels = {
    commute: isZh ? '20°C 完美' : '20°C Perfect',
    date: isZh ? '22°C 完美' : '22°C Perfect',
    casual: isZh ? '18°C 舒适' : '18°C Comfort',
  };
  const notes = {
    commute: [
      {
        icon: 'palette' as const,
        title: isZh ? '衬托你的肤色' : 'Matches your skin tone',
        content: isZh
          ? '海军蓝西装外套与你的冷调肤色形成美丽对比，呈现出健康明亮的光泽。'
          : 'The navy blazer contrasts beautifully with your cool undertones, bringing out a healthy, vibrant glow.',
        bgClass: 'bg-tertiary-fixed',
        iconClass: 'text-on-tertiary-fixed-variant',
      },
      {
        icon: 'cloud_queue' as const,
        title: isZh ? '适合 20°C 天气' : 'Suitable for 20°C Weather',
        content: isZh
          ? '轻盈的羊毛混纺在通勤时提供透气性，同时抵御清晨微凉。'
          : 'The lightweight wool blend offers breathability for your commute while maintaining warmth against the morning breeze.',
        bgClass: 'bg-secondary-fixed',
        iconClass: 'text-on-secondary-fixed-variant',
      },
    ],
    date: [
      {
        icon: 'auto_awesome' as const,
        title: isZh ? '别致而精致' : 'Chic & Sophisticated',
        content: isZh
          ? '祖母绿真丝与结构性黑色皮革的高对比组合，散发出毫不费力的优雅。'
          : 'This high-contrast combination of emerald silk and structural black leather commands effortless elegance.',
        bgClass: 'bg-primary-fixed',
        iconClass: 'text-on-primary-fixed-variant',
      },
      {
        icon: 'thermostat' as const,
        title: isZh ? '理想微凉夜晚' : 'Ideal for Mild Evening',
        content: isZh
          ? '飘逸真丝在室内保持凉爽，而结构性夹克为夜间温差提供完美保暖。'
          : 'Flowy silk keeps you cool indoors, while the structured jacket provides perfect insulation for night transitions.',
        bgClass: 'bg-secondary-fixed',
        iconClass: 'text-on-secondary-fixed-variant',
      },
    ],
    casual: [
      {
        icon: 'checkroom' as const,
        title: isZh ? '轻松的垂坠廓形' : 'Effortless Draped Silhouette',
        content: isZh
          ? '象牙白绉纱衬衫搭配结构性炭灰长裤，营造出干净、知性又别致的感觉。'
          : 'An ivory crepe blouse paired with structured charcoal trousers gives a clean, scholarly yet chic feel.',
        bgClass: 'bg-secondary-fixed',
        iconClass: 'text-on-secondary-fixed-variant',
      },
      {
        icon: 'sentiment_very_satisfied' as const,
        title: isZh ? '全天舒适' : 'All-day comfort',
        content: isZh
          ? '透气飘逸的面料搭配经典乐福鞋，让你从早到晚都舒适而精致。'
          : 'Breathable, flowing fabrics styled with classic loafers keep you cozy yet refined from day to night.',
        bgClass: 'bg-tertiary-fixed',
        iconClass: 'text-on-tertiary-fixed-variant',
      },
    ],
  };

  return [
    {
      id: 'outfit-1',
      name: outfitNames.commute,
      scenario: 'Commute',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkgvRRIoxnzEGrjNxf9r_qxVUvsfQLoGS6x0O_t20xismypTuOFOzHwkfnNJUwyl2T_DzZR8qy0N56Pd0859cKD730FCy6ElfaQ82VyIqS_WJNHIOOdRDch7VEsW_kOHqETcun0WuiRQHZ9gLVQ9fOi9Ypv6Uw5cgLgusZcIcecUhvsWdNiXvvNs3yALpTPnEXsz0kZsFIw8MGu_TzyXZz90iLe172iwTRtnujpru4huTYhrKgR3A',
      tempPerfect: tempLabels.commute,
      curationNotes: notes.commute,
      items: [items[1], items[8]],
    },
    {
      id: 'outfit-2',
      name: outfitNames.date,
      scenario: 'Date',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEpoOvjlvr73VlFQTJoVyFFGPX0qU1ieCoWHZO0ypX0RZ2otjwQOCGcCw3c9Xm-2pbaiIxmWQ5Wwj2OF4fHz09_NL1L0hWDRA7MwavdWxFYiE5FXOfhl7ZaseCu8YK8miIz9H1xn3suxuFQwnRbHkyhMkx_eepZcLgUr9AJaSy7L8iFzY2wU5KT9azoC6rz78-H57L3mEUxpeL40Pg-H3K2kS8dXQnkRRxxT5mD5JpEF5pv2m7Ucg',
      tempPerfect: tempLabels.date,
      curationNotes: notes.date,
      items: [items[6], items[3]],
    },
    {
      id: 'outfit-3',
      name: outfitNames.casual,
      scenario: 'Casual',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0I2XTz8PhphuIcrCA3S22OuduwzQ5SD3owmAzyD_ZGB8h3cuS7RJXYQlG4oUq0f6OPjW1yE4c6ZovqJwESISeY1tk2Qx1AErbwzmafnZrdfwq4Q9v7VbxIVrFX62clr8VnG4TVDRlqLeBy6xiM7ZHyAuOakBUqKl3EfePcQsF-WNjFw9y2_uCdB77b0azF6MRcwa3FUO64Q5qo3KacMrF_x87yd3ZfBXeBYnGK6QnCsYpW-VgpdY',
      tempPerfect: tempLabels.casual,
      curationNotes: notes.casual,
      items: [items[0], items[2]],
    },
  ];
}

export function getInitialOutfits(language: Language): Outfit[] {
  return makeOutfits(language);
}

export const INITIAL_OUTFITS: Outfit[] = makeOutfits('en');
