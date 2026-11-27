export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark';
export type Gender = 'male' | 'female';
export type WorkActivity = 'sedentary' | 'moderate' | 'active';
export type SportsFrequency = 'none' | '1-2' | '3-4' | '5+';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  dailyCalorieLimit: number;
  workActivity: WorkActivity;
  doesSports: boolean;
  sportsFrequency: SportsFrequency;
  steps8kDaily: boolean;
  onboarded: boolean;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
}

export interface MealEntry {
  id: string;
  dateStr: string; // YYYY-MM-DD
  timestamp: string; // ISO
  dishName: string;
  weightGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: MealType;
  ingredients: Ingredient[];
  aiTip: string;
  photoDataUrl: string;
  source: 'ai' | 'manual';
}

export interface RequestHistoryEntry {
  id: string;
  timestamp: string;
  dishName: string;
  weightGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: MealType;
  ingredients: Ingredient[];
  aiTip: string;
  photoDataUrl: string;
}
