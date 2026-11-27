import { Gender, Language, SportsFrequency, WorkActivity } from '../types';

export interface RecommendationInput {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  workActivity: WorkActivity;
  doesSports: boolean;
  sportsFrequency: SportsFrequency;
  steps8kDaily: boolean;
}

export interface RecommendationResult {
  bmr: number;
  maintenanceCalories: number;
  loseCalories: number;
  gainCalories: number;
  multiplier: number;
  macrosMaintain: { protein: number; fat: number; carbs: number };
  summary: string;
}

export function calculateCalorieRecommendation(
  input: RecommendationInput,
  lang: Language
): RecommendationResult {
  const safeWeight = Math.max(30, Math.min(250, input.weightKg || 70));
  const safeHeight = Math.max(120, Math.min(230, input.heightCm || 170));
  const safeAge = Math.max(12, Math.min(100, input.age || 28));

  // Mifflin-St Jeor Equation
  const baseBmr =
    10 * safeWeight +
    6.25 * safeHeight -
    5 * safeAge +
    (input.gender === 'male' ? 5 : -161);

  // Base activity multiplier from work type
  let multiplier = 1.2;
  if (input.workActivity === 'moderate') multiplier = 1.35;
  if (input.workActivity === 'active') multiplier = 1.5;

  // Sports frequency bonus
  if (input.doesSports) {
    if (input.sportsFrequency === '1-2') multiplier += 0.1;
    if (input.sportsFrequency === '3-4') multiplier += 0.2;
    if (input.sportsFrequency === '5+') multiplier += 0.3;
  }

  // 8,000+ daily steps bonus
  if (input.steps8kDaily) {
    multiplier += 0.1;
  }

  const maintenanceCalories = Math.round((baseBmr * multiplier) / 10) * 10;
  const loseCalories = Math.max(1200, Math.round((maintenanceCalories * 0.85) / 10) * 10);
  const gainCalories = Math.round((maintenanceCalories * 1.15) / 10) * 10;

  // Balanced macro split: 25% protein, 30% fat, 45% carbs
  const macrosMaintain = {
    protein: Math.round((maintenanceCalories * 0.25) / 4),
    fat: Math.round((maintenanceCalories * 0.3) / 9),
    carbs: Math.round((maintenanceCalories * 0.45) / 4),
  };

  const partsRu: string[] = [];
  if (input.workActivity === 'sedentary') partsRu.push('сидячего режима работы');
  if (input.workActivity === 'moderate') partsRu.push('умеренной подвижности');
  if (input.workActivity === 'active') partsRu.push('активной физической работы');
  if (input.doesSports) {
    partsRu.push(`тренировок (${input.sportsFrequency} р/нед)`);
  } else {
    partsRu.push('отсутствия спорта');
  }
  if (input.steps8kDaily) {
    partsRu.push('нормы 8 000+ шагов в день');
  } else {
    partsRu.push('невысокой ходьбы (< 8 000 шагов)');
  }

  const partsEn: string[] = [];
  if (input.workActivity === 'sedentary') partsEn.push('sedentary work');
  if (input.workActivity === 'moderate') partsEn.push('moderate daily activity');
  if (input.workActivity === 'active') partsEn.push('active physical work');
  if (input.doesSports) {
    partsEn.push(`sports (${input.sportsFrequency}x/week)`);
  } else {
    partsEn.push('no regular sports');
  }
  if (input.steps8kDaily) {
    partsEn.push('8,000+ daily steps');
  } else {
    partsEn.push('under 8,000 daily steps');
  }

  const summary =
    lang === 'ru'
      ? `Расчёт по формуле Миффлина-Сан Жеора с учётом ${partsRu.join(', ')}. Базовый обмен: ~${Math.round(baseBmr)} ккал.`
      : `Mifflin-St Jeor estimate factoring in ${partsEn.join(', ')}. Basal metabolic rate: ~${Math.round(baseBmr)} kcal.`;

  return {
    bmr: Math.round(baseBmr),
    maintenanceCalories,
    loseCalories,
    gainCalories,
    multiplier: Number(multiplier.toFixed(2)),
    macrosMaintain,
    summary,
  };
}

export async function compressImageFile(
  file: File,
  maxDimension = 960,
  quality = 0.8
): Promise<{ aiDataUrl: string; thumbDataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const resize = (limit: number, q: number): string => {
          let { width, height } = img;
          if (width > limit || height > limit) {
            if (width > height) {
              height = Math.round((height * limit) / width);
              width = limit;
            } else {
              width = Math.round((width * limit) / height);
              height = limit;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return src;
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', q);
        };

        const aiDataUrl = resize(maxDimension, quality);
        const thumbDataUrl = resize(540, 0.72);
        resolve({ aiDataUrl, thumbDataUrl });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function getLocalDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
