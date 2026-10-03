export interface GameMetadata {
  id: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  iconName: string;
  category: 'Memory' | 'Routine' | 'Sensory' | 'Rhythm' | 'Coordination' | 'Exploration' | 'Orientation';
  route: string;
  color: string;
  themeColor: string;
  recommendedTime: string;
}

export interface GameCompletionResult {
  gameId: string;
  gameTitle: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  hintsUsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  encouragementMessage: string;
}

export interface MemoryWeaveCard {
  id: string;
  title: string;
  category: 'Person' | 'Place' | 'Object' | 'Event' | 'Northeast Memory';
  imageOrEmoji: string;
  matchGroup: string;
  description: string;
}

export interface RoutineStep {
  id: string;
  order: number;
  title: string;
  description: string;
  iconName: string;
  illustration: string;
}

export interface SoundItem {
  id: string;
  title: string;
  category: string;
  soundType: 'rain' | 'birds' | 'water' | 'doorbell' | 'train' | 'cooking';
  icon: string;
  correctDescription: string;
  distractors: string[];
}

export interface MarketItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  inStock: boolean;
  alternative?: string;
  altIcon?: string;
  price?: number;
}

export interface LandmarkNode {
  id: string;
  name: string;
  state: string;
  description: string;
  x: number;
  y: number;
  icon: string;
}
