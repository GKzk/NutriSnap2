import React, { useState } from 'react';
import { AppSettings, Gender, UserProfile } from '../types';
import { translations } from '../i18n';
import { calculateCalorieRecommendation } from '../utils/calorieCalc';
import { Moon, Sun } from 'lucide-react';

interface OnboardingProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  settings,
  onUpdateSettings,
  onComplete,
}) => {
  const t = translations[settings.language];
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<Gender>('male');
  const [weightKg, setWeightKg] = useState(74);
  const [heightCm, setHeightCm] = useState(176);

  const recommended = calculateCalorieRecommendation(
    {
      gender,
      age,
      weightKg,
      heightCm,
      workActivity: 'moderate',
      doesSports: false,
      sportsFrequency: 'none',
      steps8kDaily: true,
    },
    settings.language
  ).maintenanceCalories;

  const [customLimit, setCustomLimit] = useState<string>('');
  const displayLimit = customLimit !== '' ? Number(customLimit) : recommended;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || (settings.language === 'ru' ? 'Пользователь' : 'User');
    onComplete({
      name: trimmedName,
      age: Math.max(12, Math.min(100, Number(age) || 28)),
      gender,
      weightKg: Math.max(30, Math.min(250, Number(weightKg) || 70)),
      heightCm: Math.max(120, Math.min(230, Number(heightCm) || 170)),
      dailyCalorieLimit: Math.max(800, Number(displayLimit) || recommended),
      workActivity: 'moderate',
      doesSports: false,
      sportsFrequency: 'none',
      steps8kDaily: true,
      onboarded: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-8 pt-safe pb-safe transition-colors">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Top quick toggles for Language & Theme */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {t.appName}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ language: settings.language === 'ru' ? 'en' : 'ru' })
              }
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.language === 'ru' ? 'RU' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
              }
              aria-label={t.themeLabel}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm"
        >
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              {t.welcomeTitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.welcomeSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {t.nameLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.ageLabel}
                </label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.genderLabel}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                      gender === 'male'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.male}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                      gender === 'female'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.female}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.weightLabel}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={30}
                  max={250}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.heightLabel}
                </label>
                <input
                  type="number"
                  min={120}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {t.dailyLimitLabel}
              </label>
              <input
                type="number"
                min={800}
                max={6000}
                value={customLimit !== '' ? customLimit : recommended}
                onChange={(e) => setCustomLimit(e.target.value)}
                className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {t.autoCalculatedHint}
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm transition-colors active:scale-[0.99]"
          >
            {t.startUsing}
          </button>
        </form>
      </div>
    </div>
  );
};
