export interface Item {
  id: string;
  name: string;
  brand: string;
  category: 'tops' | 'bottoms' | 'shoes' | 'accessories';
  material: string;
  color: string;
  colorHex?: string;
  size: string;
  image: string;
  isFavorite?: boolean;
}

export interface CurationNote {
  icon: string;
  title: string;
  content: string;
  bgClass?: string;
  iconClass?: string;
}

export interface Outfit {
  id: string;
  name: string;
  scenario: 'Commute' | 'Date' | 'Casual';
  image: string;
  tempPerfect: string;
  curationNotes: CurationNote[];
  items: Item[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  skinTone?: string;
  skinToneColor?: string;
  bodyType?: string;
  recommendationColors?: { name: string; hex: string }[];
}
