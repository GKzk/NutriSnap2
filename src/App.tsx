/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  Utensils,
  Flame,
  Calendar,
  User,
  TrendingUp,
  Droplet,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ChevronRight,
  Info,
  Clock,
  Award,
  Search,
  Coffee,
  Sun,
  Moon,
  Apple,
  RotateCcw,
  Zap,
  ShieldCheck,
  Smartphone,
  Github,
  Download,
  ExternalLink,
  Maximize2
} from "lucide-react";
import { PWAInstallButton, OfflineIndicator } from "./components/PWAInstallButton";

interface Ingredient {
  name: string;
  amount: string;
}

interface MealItem {
  id: string;
  timestamp: string; // ISO string
  dateStr: string; // YYYY-MM-DD
  dishName: string;
  weightGrams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients: Ingredient[];
  healthScore: number;
  aiTip: string;
  image: string; // base64 or url
}

interface UserProfile {
  name: string;
  targetCalories: number;
  targetWater: number;
  currentWeight: number;
  targetWeight: number;
  goalType: "lose" | "maintain" | "gain";
}

const PRESET_DISHES = [
  {
    name: "Салат Цезарь с курицей",
    url: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80",
    mealType: "lunch" as const,
    calories: 380,
    protein: 28,
    fat: 22,
    carbs: 12,
    weightGrams: 280,
    healthScore: 8,
    aiTip: "Отличный источник белка и зелени. Соус можно сделать менее калорийным.",
    ingredients: [
      { name: "Куриная грудка гриль", amount: "120г" },
      { name: "Салат Романо", amount: "80г" },
      { name: "Соус Цезарь", amount: "30г" },
      { name: "Сухарики", amount: "25г" },
      { name: "Сыр Пармезан", amount: "25г" }
    ]
  },
  {
    name: "Поке с лососем и авокадо",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    mealType: "lunch" as const,
    calories: 520,
    protein: 31,
    fat: 18,
    carbs: 58,
    weightGrams: 350,
    healthScore: 9,
    aiTip: "Полезные полиненасыщенные жиры омега-3 и сложные углеводы.",
    ingredients: [
      { name: "Лосось слабосоленый", amount: "100г" },
      { name: "Рис", amount: "150г" },
      { name: "Авокадо", amount: "60г" },
      { name: "Эдамаме", amount: "40г" }
    ]
  },
  {
    name: "Тост с авокадо и яйцом пашот",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80",
    mealType: "breakfast" as const,
    calories: 340,
    protein: 14,
    fat: 20,
    carbs: 26,
    weightGrams: 200,
    healthScore: 9,
    aiTip: "Заряд энергии на утро с полезными жирами и качественным белком.",
    ingredients: [
      { name: "Хлеб цельнозерновой", amount: "2 кус." },
      { name: "Авокадо", amount: "70г" },
      { name: "Яйцо", amount: "1 шт" }
    ]
  }
];

const INITIAL_PROFILE: UserProfile = {
  name: "Алексей",
  targetCalories: 2000,
  targetWater: 8,
  currentWeight: 76.5,
  targetWeight: 72.0,
  goalType: "lose"
};

const TODAY_STR = new Date().toISOString().split("T")[0];

const INITIAL_MEALS: MealItem[] = [
  {
    id: "m-1",
    timestamp: new Date(new Date().setHours(8, 30)).toISOString(),
    dateStr: TODAY_STR,
    dishName: "Тост с авокадо и яйцом пашот",
    weightGrams: 200,
    calories: 340,
    protein: 14,
    fat: 20,
    carbs: 26,
    mealType: "breakfast",
    ingredients: [
      { name: "Хлеб цельнозерновой", amount: "2 кус." },
      { name: "Авокадо", amount: "70г" },
      { name: "Яйцо", amount: "1 шт" }
    ],
    healthScore: 9,
    aiTip: "Отличный завтрак с полезными жирами!",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "m-2",
    timestamp: new Date(new Date().setHours(13, 45)).toISOString(),
    dateStr: TODAY_STR,
    dishName: "Поке с лососем и авокадо",
    weightGrams: 350,
    calories: 520,
    protein: 31,
    fat: 18,
    carbs: 58,
    mealType: "lunch",
    ingredients: [
      { name: "Лосось", amount: "100г" },
      { name: "Рис", amount: "150г" },
      { name: "Авокадо", amount: "60г" }
    ],
    healthScore: 9,
    aiTip: "Сбалансированный обед богатый омега-3.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "profile" | "advice">("dashboard");
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("nutrisnap_profile");
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [meals, setMeals] = useState<MealItem[]>(() => {
    const saved = localStorage.getItem("nutrisnap_meals");
    return saved ? JSON.parse(saved) : INITIAL_MEALS;
  });

  const [waterDrank, setWaterDrank] = useState<number>(() => {
    const saved = localStorage.getItem(`nutrisnap_water_${TODAY_STR}`);
    return saved ? parseInt(saved, 10) : 3;
  });

  // AI Scanning state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [pendingMeal, setPendingMeal] = useState<Partial<MealItem> | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    dishName: "",
    calories: 350,
    protein: 20,
    fat: 15,
    carbs: 35,
    weightGrams: 250,
    mealType: "lunch" as MealItem["mealType"],
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
  });

  // iPhone Mockup & Export Modals
  const [showIphoneMockup, setShowIphoneMockup] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("nutrisnap_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("nutrisnap_meals", JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem(`nutrisnap_water_${TODAY_STR}`, waterDrank.toString());
  }, [waterDrank]);

  const todayMeals = meals.filter((m) => m.dateStr === TODAY_STR);
  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
  const totalFat = todayMeals.reduce((sum, m) => sum + m.fat, 0);
  const totalCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);

  const caloriePercentage = Math.min(100, Math.round((totalCalories / profile.targetCalories) * 100));
  const remainingCalories = Math.max(0, profile.targetCalories - totalCalories);

  const handleImageFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      await analyzeImageWithAI(base64Image, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = async (preset: typeof PRESET_DISHES[0]) => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setTimeout(() => setAnalysisStep(2), 700);
    setTimeout(() => setAnalysisStep(3), 1400);

    try {
      const res = await fetch(preset.url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await sendToBackend(base64data, blob.type, userPrompt || preset.name);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setTimeout(() => {
        setIsAnalyzing(false);
        setPendingMeal({
          dishName: preset.name,
          weightGrams: preset.weightGrams,
          calories: preset.calories,
          protein: preset.protein,
          fat: preset.fat,
          carbs: preset.carbs,
          mealType: preset.mealType,
          ingredients: preset.ingredients,
          healthScore: preset.healthScore,
          aiTip: preset.aiTip,
          image: preset.url
        });
      }, 1500);
    }
  };

  const analyzeImageWithAI = async (base64Image: string, mimeType: string) => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 900);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1800);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          mimeType: mimeType || "image/jpeg",
          description: userPrompt
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка сервера");

      setPendingMeal({
        dishName: data.dishName || "Блюдо из фото",
        weightGrams: data.weightGrams || 250,
        calories: data.calories || 350,
        protein: data.protein || 20,
        fat: data.fat || 15,
        carbs: data.carbs || 30,
        mealType: data.mealType || "lunch",
        ingredients: data.ingredients || [],
        healthScore: data.healthScore || 8,
        aiTip: data.aiTip || "",
        image: base64Image
      });
    } catch (err: any) {
      alert("Не удалось распознать блюдо: " + err.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setUserPrompt("");
    }
  };

  const sendToBackend = async (base64Image: string, mimeType: string, description: string) => {
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, mimeType, description })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPendingMeal({
        dishName: data.dishName || "Блюдо",
        weightGrams: data.weightGrams || 250,
        calories: data.calories || 350,
        protein: data.protein || 20,
        fat: data.fat || 15,
        carbs: data.carbs || 30,
        mealType: data.mealType || "lunch",
        ingredients: data.ingredients || [],
        healthScore: data.healthScore || 8,
        aiTip: data.aiTip || "",
        image: base64Image
      });
    } catch (err: any) {
      alert("Ошибка ИИ: " + err.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setUserPrompt("");
    }
  };

  const savePendingMeal = () => {
    if (!pendingMeal) return;
    const newMeal: MealItem = {
      id: "meal-" + Date.now(),
      timestamp: new Date().toISOString(),
      dateStr: TODAY_STR,
      dishName: pendingMeal.dishName || "Блюдо",
      weightGrams: pendingMeal.weightGrams || 250,
      calories: pendingMeal.calories || 300,
      protein: pendingMeal.protein || 15,
      fat: pendingMeal.fat || 10,
      carbs: pendingMeal.carbs || 30,
      mealType: pendingMeal.mealType || "lunch",
      ingredients: pendingMeal.ingredients || [],
      healthScore: pendingMeal.healthScore || 8,
      aiTip: pendingMeal.aiTip || "",
      image: pendingMeal.image || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
    };

    setMeals([newMeal, ...meals]);
    setPendingMeal(null);
    setActiveTab("history");
  };

  const saveManualMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeal: MealItem = {
      id: "meal-" + Date.now(),
      timestamp: new Date().toISOString(),
      dateStr: TODAY_STR,
      dishName: manualForm.dishName || "Ручной ввод",
      weightGrams: manualForm.weightGrams,
      calories: manualForm.calories,
      protein: manualForm.protein,
      fat: manualForm.fat,
      carbs: manualForm.carbs,
      mealType: manualForm.mealType,
      ingredients: [{ name: manualForm.dishName, amount: `${manualForm.weightGrams}г` }],
      healthScore: 7,
      aiTip: "Добавлено вручную.",
      image: manualForm.image
    };

    setMeals([newMeal, ...meals]);
    setShowManualModal(false);
    setActiveTab("history");
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  const getMealTypeLabel = (type: MealItem["mealType"]) => {
    switch (type) {
      case "breakfast": return "Завтрак";
      case "lunch": return "Обед";
      case "dinner": return "Ужин";
      case "snack": return "Перекус";
    }
  };

  const getMealTypeIcon = (type: MealItem["mealType"]) => {
    switch (type) {
      case "breakfast": return <Sun className="w-4 h-4 text-amber-500" />;
      case "lunch": return <Utensils className="w-4 h-4 text-emerald-500" />;
      case "dinner": return <Moon className="w-4 h-4 text-indigo-500" />;
      case "snack": return <Apple className="w-4 h-4 text-rose-500" />;
    }
  };

  // App core content renderer
  const renderAppContent = () => (
    <div className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                NutriSnap
              </h1>
              <p className="text-[10px] text-slate-400">ИИ-калории</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <PWAInstallButton />
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold transition border border-slate-700"
              title="GitHub & APK & iOS"
            >
              <Github className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">GitHub / APK</span>
            </button>

            <button
              onClick={() => setShowIphoneMockup(!showIphoneMockup)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-2 rounded-xl text-xs font-semibold transition border border-slate-700"
              title="Понт на iPhone"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">iPhone Вид</span>
            </button>

            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <Camera className="w-4 h-4" />
              <span>Фото</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 pb-24">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Дневной баланс</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">Привет, {profile.name}! 👋</h2>
                  <p className="text-sm text-slate-400">
                    Сегодня съедено <span className="text-emerald-400 font-bold">{totalCalories} ккал</span> из {profile.targetCalories}.
                  </p>
                </div>

                <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800/80 px-4 py-3 rounded-2xl w-full md:w-auto justify-between">
                  <div className="text-center">
                    <div className="text-xl font-black text-white">{totalCalories}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Потреблено</div>
                  </div>
                  <div className="h-6 w-px bg-slate-800"></div>
                  <div className="text-center">
                    <div className="text-xl font-black text-emerald-400">{remainingCalories}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Осталось</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Прогресс</span>
                  <span className="font-bold text-emerald-400">{caloriePercentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${caloriePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-xs text-slate-400 mb-1">Белки</div>
                  <div className="text-base font-bold text-emerald-400">{totalProtein}г</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-xs text-slate-400 mb-1">Жиры</div>
                  <div className="text-base font-bold text-amber-400">{totalFat}г</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-xs text-slate-400 mb-1">Углеводы</div>
                  <div className="text-base font-bold text-sky-400">{totalCarbs}г</div>
                </div>
              </div>
            </div>

            {/* Water Tracker */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Droplet className="w-6 h-6 fill-sky-400/20" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Водный баланс</h3>
                  <p className="text-xs text-slate-400">Выпито стаканов: {waterDrank} из {profile.targetWater}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWaterDrank(Math.max(0, waterDrank - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="font-bold text-sky-400 w-6 text-center">{waterDrank}</span>
                <button
                  onClick={() => setWaterDrank(waterDrank + 1)}
                  className="w-8 h-8 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-sky-500/20"
                >
                  +
                </button>
              </div>
            </div>

            {/* Camera Scan Action */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden">
              <div className="max-w-md relative z-10 space-y-3">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ИИ Анализ по фото</span>
                </div>
                <h3 className="text-xl font-bold text-white">Сфотографируйте еду</h3>
                <p className="text-sm text-slate-300">
                  Загрузите снимок блюда, и наш ИИ мгновенно определит калории и БЖУ.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-sm transition shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Сделать фото</span>
                  </button>

                  <button
                    onClick={() => setShowManualModal(true)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-2xl text-sm transition border border-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Вручную</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Dishes */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <span>Популярные блюда для теста</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PRESET_DISHES.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handlePresetSelect(preset)}
                    className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition shadow-md flex flex-col"
                  >
                    <div className="h-32 overflow-hidden relative">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-xl text-xs font-bold text-emerald-400">
                        {preset.calories} ккал
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                      <h4 className="font-bold text-white text-xs group-hover:text-emerald-400 transition">{preset.name}</h4>
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center">
                        Распознать <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-white">История питания</h2>
                <p className="text-sm text-slate-400">Все записанные приемы пищи</p>
              </div>
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center space-x-1.5 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить</span>
              </button>
            </div>

            {meals.length === 0 ? (
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
                <Utensils className="w-8 h-8 mx-auto text-slate-400" />
                <h3 className="text-lg font-bold text-white">История пуста</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div key={meal.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <img src={meal.image} alt={meal.dishName} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-emerald-400 font-semibold">{getMealTypeLabel(meal.mealType)}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{meal.dishName}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-black text-emerald-400 text-sm">{meal.calories} ккал</div>
                        <div className="text-[11px] text-slate-400">{meal.weightGrams}г</div>
                      </div>
                      <button onClick={() => deleteMeal(meal.id)} className="text-slate-500 hover:text-rose-400 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold text-white">Профиль и Цели</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Имя</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Цель по калориям</label>
                <input
                  type="number"
                  value={profile.targetCalories}
                  onChange={(e) => setProfile({ ...profile, targetCalories: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <button onClick={() => alert("Сохранено!")} className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl">
                Сохранить профиль
              </button>
            </div>
          </div>
        )}

        {activeTab === "advice" && (
          <div className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-extrabold text-white">ИИ Нутрициолог</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <p className="text-sm text-slate-300">
                {totalCalories === 0
                  ? "Добавьте первый прием пищи для анализа."
                  : `Вы потребили ${totalCalories} ккал из ${profile.targetCalories}. Отличный баланс белков и углеводов сегодня!`}
              </p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium">
                💡 Пейте чистую воду за 20 минут до еды для лучшего пищеварения.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Analyzing Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">ИИ анализирует блюдо...</h3>
            <p className="text-xs text-slate-400">Считаем калории и БЖУ</p>
          </div>
        </div>
      )}

      {/* Pending Meal Modal */}
      {pendingMeal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Результат ИИ анализа</h3>
              <button onClick={() => setPendingMeal(null)} className="text-slate-400">✕</button>
            </div>
            <img src={pendingMeal.image} alt="Dish" className="w-full h-40 object-cover rounded-2xl" />
            <input
              type="text"
              value={pendingMeal.dishName}
              onChange={(e) => setPendingMeal({ ...pendingMeal, dishName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            />
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-xl">
                <div className="text-slate-400">Ккал</div>
                <div className="font-bold text-emerald-400">{pendingMeal.calories}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <div className="text-slate-400">Белки</div>
                <div className="font-bold">{pendingMeal.protein}г</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <div className="text-slate-400">Жиры</div>
                <div className="font-bold">{pendingMeal.fat}г</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl">
                <div className="text-slate-400">Углеводы</div>
                <div className="font-bold">{pendingMeal.carbs}г</div>
              </div>
            </div>
            <button
              onClick={savePendingMeal}
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Сохранить в дневник
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Ручной ввод</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={saveManualMeal} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Название блюда"
                value={manualForm.dishName}
                onChange={(e) => setManualForm({ ...manualForm, dishName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Калории"
                  value={manualForm.calories}
                  onChange={(e) => setManualForm({ ...manualForm, calories: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Вес (г)"
                  value={manualForm.weightGrams}
                  onChange={(e) => setManualForm({ ...manualForm, weightGrams: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl">
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GitHub & APK & iOS Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <Github className="w-5 h-5 text-emerald-400" />
                <span>GitHub, APK & iOS Экспорт</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>1. Репозиторий на GitHub</span>
                </div>
                <p>Удалённый репозиторий <b>GKzk/NutriSnap</b> уже прописан как origin. Выполните пуш с авторизацией:</p>
                <code className="block bg-slate-900 p-2 rounded-lg text-emerald-300 font-mono text-[11px]">
                  git push -u origin main
                </code>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>2. Сборка APK для Android</span>
                </div>
                <p>После пуша GitHub Actions сам соберёт <b>NutriSnap-debug-apk</b> во вкладке Actions. Либо локально:</p>
                <code className="block bg-slate-900 p-2 rounded-lg text-sky-300 font-mono text-[11px]">
                  npm install @capacitor/core @capacitor/cli @capacitor/android<br/>
                  npx cap add android && npx cap sync android<br/>
                  cd android && ./gradlew assembleDebug
                </code>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>3. Понт на iPhone (iOS PWA)</span>
                </div>
                <p>Откройте приложение в Safari на iPhone, нажмите кнопку <b>«Поделиться»</b> и выберите <b>«На экран „Домой“»</b>. Приложение установится как нативное iOS-приложение!</p>
              </div>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-sm"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition ${activeTab === "dashboard" ? "text-emerald-400 font-bold" : "text-slate-400"}`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px]">Главная</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition ${activeTab === "history" ? "text-emerald-400 font-bold" : "text-slate-400"}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Дневник</span>
          </button>
          <button
            onClick={() => setActiveTab("advice")}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition ${activeTab === "advice" ? "text-emerald-400 font-bold" : "text-slate-400"}`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px]">Советник</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-2xl transition ${activeTab === "profile" ? "text-emerald-400 font-bold" : "text-slate-400"}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">Профиль</span>
          </button>
        </div>
      </nav>
      <OfflineIndicator />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-6">
      {/* iPhone Mockup Showcase Mode ("Понт на айфон") */}
      {showIphoneMockup ? (
        <div className="w-full flex flex-col items-center space-y-4 py-4">
          <div className="flex items-center justify-between w-full max-w-md px-4">
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
              <Smartphone className="w-4 h-4" />
              <span>iPhone 16 Pro Showcase Mode</span>
            </div>
            <button
              onClick={() => setShowIphoneMockup(false)}
              className="bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold"
            >
              Свернуть iPhone вид ✕
            </button>
          </div>

          {/* iPhone Titanium Frame */}
          <div className="relative w-[390px] h-[844px] bg-slate-900 rounded-[50px] ring-[12px] ring-slate-800 shadow-2xl overflow-hidden flex flex-col border-4 border-slate-700">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3">
              <div className="w-3 h-3 rounded-full bg-slate-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse"></div>
            </div>

            {/* iOS Status Bar */}
            <div className="pt-3 px-6 flex justify-between items-center text-xs text-white font-semibold bg-slate-900 z-40 select-none">
              <span>9:41</span>
              <div className="flex items-center space-x-1.5 text-[10px]">
                <span>5G</span>
                <div className="w-5 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
                  <div className="h-full w-3 bg-white rounded-2xs"></div>
                </div>
              </div>
            </div>

            {/* App Screen inside iPhone */}
            <div className="flex-1 overflow-y-auto bg-slate-950">
              {renderAppContent()}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="h-5 bg-slate-900 flex items-center justify-center pb-1">
              <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full min-h-screen">
          {renderAppContent()}
        </div>
      )}
    </div>
  );
}
