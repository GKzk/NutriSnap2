/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  Flame,
  Calendar,
  User,
  Settings,
  Calculator,
  Check,
  X,
  Trash2,
  Utensils,
  Pencil,
} from 'lucide-react';
import {
  AppSettings,
  MealEntry,
  MealType,
  RequestHistoryEntry,
  UserProfile,
} from './types';
import { getMealTypeText, translations } from './i18n';
import { compressImageFile, getLocalDateStr } from './utils/calorieCalc';
import { Onboarding } from './components/Onboarding';
import { RecommendationsModal } from './components/RecommendationsModal';
import { SettingsModal } from './components/SettingsModal';
import { DiaryView } from './components/DiaryView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEYS = {
  profile: 'nutrisnap_v2_profile',
  settings: 'nutrisnap_v2_settings',
  meals: 'nutrisnap_v2_meals',
  history: 'nutrisnap_v2_requests',
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: 28,
  gender: 'male',
  weightKg: 74,
  heightCm: 176,
  dailyCalorieLimit: 2200,
  workActivity: 'moderate',
  doesSports: false,
  sportsFrequency: 'none',
  steps8kDaily: true,
  onboarded: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  language: 'ru',
  theme: 'light',
};

const DEFAULT_PUBLIC_API_BASE = 'https://nutri-snap.ai.studio';

function normalizeBaseUrl(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return '';
    return parsed.origin;
  } catch {
    return '';
  }
}

function getAnalyzeEndpoint(): string {
  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envBase) {
    return `${envBase}/api/analyze-food`;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (protocol === 'capacitor:' || (hostname === 'localhost' && !port)) {
      return `${DEFAULT_PUBLIC_API_BASE}/api/analyze-food`;
    }
  }
  return '/api/analyze-food';
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settings);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.profile);
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [meals, setMeals] = useState<MealEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.meals);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [requestHistory, setRequestHistory] = useState<RequestHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.history);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'today' | 'diary' | 'profile'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateStr());
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline daily limit edit
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitDraft, setLimitDraft] = useState('');

  // Photo capture & AI state
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [pendingMeal, setPendingMeal] = useState<Omit<MealEntry, 'id' | 'dateStr' | 'timestamp'> | null>(null);

  // Profile edit state
  const [profileDraft, setProfileDraft] = useState<UserProfile>(profile);

  useEffect(() => {
    setProfileDraft(profile);
  }, [profile]);

  // Apply light / dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', settings.theme === 'dark' ? '#020617' : '#f8fafc');
    }
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.meals, JSON.stringify(meals));
    } catch {
      // Keep running in memory if storage quota exceeded
    }
  }, [meals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(requestHistory.slice(0, 40)));
    } catch {
      // Ignore quota errors
    }
  }, [requestHistory]);

  const t = translations[settings.language];
  const todayStr = getLocalDateStr();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const todayMeals = useMemo(
    () => meals.filter((m) => m.dateStr === todayStr),
    [meals, todayStr]
  );

  const todayTotals = useMemo(
    () =>
      todayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          fat: acc.fat + m.fat,
          carbs: acc.carbs + m.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      ),
    [todayMeals]
  );

  const limit = Math.max(1, profile.dailyCalorieLimit);
  const progressPct = Math.min(100, Math.round((todayTotals.calories / limit) * 100));
  const diffCalories = limit - todayTotals.calories;

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handlePhotoSelected = async (file: File) => {
    setIsAnalyzing(true);
    setAiWarning(null);

    let aiDataUrl = '';
    let thumbDataUrl = '';

    try {
      const compressed = await compressImageFile(file);
      aiDataUrl = compressed.aiDataUrl;
      thumbDataUrl = compressed.thumbDataUrl;
    } catch {
      setIsAnalyzing(false);
      showToast(t.aiErrorFallback);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(getAnalyzeEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: aiDataUrl,
          mimeType: 'image/jpeg',
          language: settings.language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('AUTH_REDIRECT');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      const parsedMeal: Omit<MealEntry, 'id' | 'dateStr' | 'timestamp'> = {
        dishName: String(data.dishName || (settings.language === 'ru' ? 'Блюдо по фото' : 'Meal from photo')),
        weightGrams: Math.max(1, Math.round(Number(data.weightGrams) || 250)),
        calories: Math.max(0, Math.round(Number(data.calories) || 0)),
        protein: Math.max(0, Math.round(Number(data.protein) || 0)),
        fat: Math.max(0, Math.round(Number(data.fat) || 0)),
        carbs: Math.max(0, Math.round(Number(data.carbs) || 0)),
        mealType: (['breakfast', 'lunch', 'dinner', 'snack'].includes(data.mealType)
          ? data.mealType
          : 'lunch') as MealType,
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        aiTip: String(data.aiTip || ''),
        photoDataUrl: thumbDataUrl,
        source: 'ai',
      };

      const reqEntry: RequestHistoryEntry = {
        id: 'req-' + Date.now(),
        timestamp: new Date().toISOString(),
        ...parsedMeal,
      };
      setRequestHistory((prev) => [reqEntry, ...prev]);
      setPendingMeal(parsedMeal);
    } catch (err) {
      // Allow user to still save their photo & manually enter calories cleanly
      const isAuthBlocked =
        err instanceof Error && err.message === 'AUTH_REDIRECT';
      setAiWarning(isAuthBlocked ? t.aiAuthBlockedFallback : t.aiErrorFallback);
      setPendingMeal({
        dishName: '',
        weightGrams: 250,
        calories: 300,
        protein: 15,
        fat: 10,
        carbs: 35,
        mealType: 'lunch',
        ingredients: [],
        aiTip: '',
        photoDataUrl: thumbDataUrl,
        source: 'manual',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openManualEntry = () => {
    setAiWarning(null);
    setPendingMeal({
      dishName: '',
      weightGrams: 250,
      calories: 350,
      protein: 20,
      fat: 12,
      carbs: 40,
      mealType: 'lunch',
      ingredients: [],
      aiTip: '',
      photoDataUrl: '',
      source: 'manual',
    });
  };

  const savePendingMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMeal) return;

    const newEntry: MealEntry = {
      id: 'meal-' + Date.now(),
      dateStr: todayStr,
      timestamp: new Date().toISOString(),
      dishName:
        pendingMeal.dishName.trim() ||
        (settings.language === 'ru' ? 'Приём пищи' : 'Meal'),
      weightGrams: Math.max(1, Number(pendingMeal.weightGrams) || 250),
      calories: Math.max(0, Number(pendingMeal.calories) || 0),
      protein: Math.max(0, Number(pendingMeal.protein) || 0),
      fat: Math.max(0, Number(pendingMeal.fat) || 0),
      carbs: Math.max(0, Number(pendingMeal.carbs) || 0),
      mealType: pendingMeal.mealType,
      ingredients: pendingMeal.ingredients,
      aiTip: pendingMeal.aiTip,
      photoDataUrl: pendingMeal.photoDataUrl,
      source: pendingMeal.source,
    };

    setMeals((prev) => [newEntry, ...prev]);
    setPendingMeal(null);
    setAiWarning(null);
    setSelectedDate(todayStr);
  };

  const handleReuseRequest = (entry: RequestHistoryEntry) => {
    const newEntry: MealEntry = {
      id: 'meal-' + Date.now(),
      dateStr: todayStr,
      timestamp: new Date().toISOString(),
      dishName: entry.dishName,
      weightGrams: entry.weightGrams,
      calories: entry.calories,
      protein: entry.protein,
      fat: entry.fat,
      carbs: entry.carbs,
      mealType: entry.mealType,
      ingredients: entry.ingredients,
      aiTip: entry.aiTip,
      photoDataUrl: entry.photoDataUrl,
      source: 'ai',
    };
    setMeals((prev) => [newEntry, ...prev]);
    setSelectedDate(todayStr);
    setActiveTab('today');
    showToast(entry.dishName);
  };

  const handleDeleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const handleResetAll = () => {
    localStorage.removeItem(STORAGE_KEYS.profile);
    localStorage.removeItem(STORAGE_KEYS.meals);
    localStorage.removeItem(STORAGE_KEYS.history);
    setMeals([]);
    setRequestHistory([]);
    setProfile(DEFAULT_PROFILE);
    setActiveTab('today');
  };

  // Show simple registration screen on first launch
  if (!profile.onboarded) {
    return (
      <Onboarding
        settings={settings}
        onUpdateSettings={updateSettings}
        onComplete={(newProfile) => setProfile(newProfile)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Compact 1-row Top Bar */}
      <header className="sticky top-0 z-30 pt-safe bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            {t.appName}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton language={settings.language} />

            <button
              type="button"
              onClick={() => setShowRecommendations(true)}
              className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t.recommendations}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label={t.settings}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden native file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handlePhotoSelected(f);
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handlePhotoSelected(f);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 pb-24">
        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left / Main column: Daily Balance + Scan Actions */}
            <div className="lg:col-span-7 space-y-5">
              {/* Daily Balance Card */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {t.dailyBalance}
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {t.hello}, {profile.name}
                    </h1>
                  </div>

                  {!editingLimit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLimitDraft(String(profile.dailyCalorieLimit));
                        setEditingLimit(true);
                      }}
                      className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{t.editLimit}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={800}
                        max={8000}
                        value={limitDraft}
                        onChange={(e) => setLimitDraft(e.target.value)}
                        className="w-20 min-h-[38px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded-xl px-2.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = Math.max(
                            800,
                            Math.min(8000, Number(limitDraft) || profile.dailyCalorieLimit)
                          );
                          setProfile((p) => ({ ...p, dailyCalorieLimit: parsed }));
                          setEditingLimit(false);
                          showToast(t.appliedToast);
                        }}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Big Calorie Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {todayTotals.calories}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.consumed}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {profile.dailyCalorieLimit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.limit}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div
                      className={`font-mono tabular-nums text-xl sm:text-2xl font-bold ${
                        diffCalories >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {Math.abs(diffCalories)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {diffCalories >= 0 ? t.remaining : t.overLimit}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    <span>{progressPct}%</span>
                    <span>
                      {todayTotals.calories} / {profile.dailyCalorieLimit} {t.kcal}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        diffCalories >= 0 ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Macros Strip */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.protein}</div>
                    <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayTotals.protein}{t.gramsShort}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.fat}</div>
                    <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayTotals.fat}{t.gramsShort}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.carbs}</div>
                    <div className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {todayTotals.carbs}{t.gramsShort}
                    </div>
                  </div>
                </div>
              </section>

              {/* Thumb-Friendly Photo & Add Controls */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.addMealTitle}
                </h2>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2.5 transition-colors active:scale-[0.99]"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t.takePhoto}</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="min-h-[46px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{t.chooseGallery}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openManualEntry}
                    className="min-h-[46px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addManual}</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Right / Secondary column: Today's Logged Meals */}
            <section className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.todayMeals}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setActiveTab('diary');
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline min-h-[32px] px-1"
                >
                  {t.viewAllDiary}
                </button>
              </div>

              {todayMeals.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t.noMealsToday}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {todayMeals.map((meal) => (
                    <div key={meal.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {meal.photoDataUrl ? (
                          <img
                            src={meal.photoDataUrl}
                            alt={meal.dishName}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                            <Utensils className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {getMealTypeText(settings.language, meal.mealType)} ·{' '}
                            {new Date(meal.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {meal.dishName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {meal.calories} {t.kcal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(meal.id)}
                          aria-label={t.deleteMeal}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* DIARY TAB */}
        {activeTab === 'diary' && (
          <DiaryView
            language={settings.language}
            meals={meals}
            requestHistory={requestHistory}
            dailyLimit={profile.dailyCalorieLimit}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onDeleteMeal={handleDeleteMeal}
            onReuseRequest={handleReuseRequest}
          />
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-lg mx-auto space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.profileTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>{t.settings}</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProfile({ ...profileDraft, onboarded: true });
                showToast(t.save);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
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
                    value={profileDraft.age}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, age: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.genderLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setProfileDraft({ ...profileDraft, gender: 'male' })}
                      className={`min-h-[36px] rounded-lg text-xs font-semibold ${
                        profileDraft.gender === 'male'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.male}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileDraft({ ...profileDraft, gender: 'female' })}
                      className={`min-h-[36px] rounded-lg text-xs font-semibold ${
                        profileDraft.gender === 'female'
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
                    value={profileDraft.weightKg}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, weightKg: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t.heightLabel}
                  </label>
                  <input
                    type="number"
                    value={profileDraft.heightCm}
                    onChange={(e) =>
                      setProfileDraft({ ...profileDraft, heightCm: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
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
                  max={8000}
                  value={profileDraft.dailyCalorieLimit}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      dailyCalorieLimit: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm transition-colors"
              >
                {t.save}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* AI Analyzing Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {t.analyzingTitle}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t.analyzingSub}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Save Meal Modal (works for both AI photo results and Manual entry) */}
      {pendingMeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={savePendingMeal}
            className="w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl"
          >
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3" />

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.reviewTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPendingMeal(null);
                  setAiWarning(null);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-safe">
              {aiWarning && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  {aiWarning}
                </div>
              )}

              {pendingMeal.photoDataUrl && (
                <img
                  src={pendingMeal.photoDataUrl}
                  alt={pendingMeal.dishName || 'Meal'}
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover rounded-2xl bg-slate-100 dark:bg-slate-800"
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.dishNameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.dishNameLabel}
                  value={pendingMeal.dishName}
                  onChange={(e) =>
                    setPendingMeal({ ...pendingMeal, dishName: e.target.value })
                  }
                  className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.kcal}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pendingMeal.calories}
                    onChange={(e) =>
                      setPendingMeal({ ...pendingMeal, calories: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.weightGramsLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pendingMeal.weightGrams}
                    onChange={(e) =>
                      setPendingMeal({ ...pendingMeal, weightGrams: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {t.protein} ({t.gramsShort})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pendingMeal.protein}
                    onChange={(e) =>
                      setPendingMeal({ ...pendingMeal, protein: Number(e.target.value) })
                    }
                    className="w-full min-h-[42px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-center text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {t.fat} ({t.gramsShort})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pendingMeal.fat}
                    onChange={(e) =>
                      setPendingMeal({ ...pendingMeal, fat: Number(e.target.value) })
                    }
                    className="w-full min-h-[42px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-center text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {t.carbs} ({t.gramsShort})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pendingMeal.carbs}
                    onChange={(e) =>
                      setPendingMeal({ ...pendingMeal, carbs: Number(e.target.value) })
                    }
                    className="w-full min-h-[42px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-center text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t.mealTypeLabel}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPendingMeal({ ...pendingMeal, mealType: type })}
                      className={`min-h-[40px] rounded-xl text-xs font-semibold border transition-colors ${
                        pendingMeal.mealType === type
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {getMealTypeText(settings.language, type)}
                    </button>
                  ))}
                </div>
              </div>

              {pendingMeal.aiTip && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pendingMeal.aiTip}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{t.saveWithPhoto}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recommendations Modal */}
      <RecommendationsModal
        isOpen={showRecommendations}
        onClose={() => setShowRecommendations(false)}
        language={settings.language}
        profile={profile}
        onApplyLimit={(newLimit, updatedFields) => {
          setProfile((prev) => ({
            ...prev,
            ...updatedFields,
            dailyCalorieLimit: newLimit,
          }));
          showToast(t.appliedToast);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        profile={profile}
        onUpdateLimit={(newLimit) => {
          setProfile((prev) => ({ ...prev, dailyCalorieLimit: newLimit }));
          showToast(t.appliedToast);
        }}
        onResetAll={handleResetAll}
      />

      {/* Non-intrusive Toast */}
      {toastMessage && (
        <div className="fixed top-[calc(env(safe-area-inset-top)+4rem)] left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* 3-Tab Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'today'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[11px] tracking-tight">{t.navToday}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diary')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'diary'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[11px] tracking-tight">{t.navDiary}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'profile'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px] tracking-tight">{t.navProfile}</span>
          </button>
        </div>
      </nav>

      <OfflineIndicator language={settings.language} />
    </div>
  );
}
