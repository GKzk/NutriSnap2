import React, { useMemo, useState } from 'react';
import { Trash2, Plus, Search, Utensils, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, MealEntry, RequestHistoryEntry } from '../types';
import { getMealTypeText, translations } from '../i18n';
import { getLocalDateStr } from '../utils/calorieCalc';

interface DiaryViewProps {
  language: Language;
  meals: MealEntry[];
  requestHistory: RequestHistoryEntry[];
  dailyLimit: number;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onDeleteMeal: (id: string) => void;
  onReuseRequest: (entry: RequestHistoryEntry) => void;
}

type DiarySubTab = 'daily' | 'weekly' | 'requests';

export const DiaryView: React.FC<DiaryViewProps> = ({
  language,
  meals,
  requestHistory,
  dailyLimit,
  selectedDate,
  onSelectDate,
  onDeleteMeal,
  onReuseRequest,
}) => {
  const t = translations[language];
  const [subTab, setSubTab] = useState<DiarySubTab>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMeal, setExpandedMeal] = useState<MealEntry | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Build 14-day horizontal scroller ending today
  const dateChips = useMemo(() => {
    const arr: { dateStr: string; dayNum: number; weekday: string }[] = [];
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        dateStr: getLocalDateStr(d),
        dayNum: d.getDate(),
        weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
      });
    }
    return arr;
  }, [language]);

  // Daily filtered meals
  const dayMeals = useMemo(
    () => meals.filter((m) => m.dateStr === selectedDate),
    [meals, selectedDate]
  );

  const dayTotals = useMemo(
    () =>
      dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          fat: acc.fat + m.fat,
          carbs: acc.carbs + m.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      ),
    [dayMeals]
  );

  // Weekly 7-day data (Mon-Sun for weekOffset)
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + weekOffset * 7);

    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    const result: {
      dateStr: string;
      label: string;
      dayNum: number;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      count: number;
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateStr(d);
      const matching = meals.filter((m) => m.dateStr === dateStr);
      result.push({
        dateStr,
        label: d.toLocaleDateString(locale, { weekday: 'short' }),
        dayNum: d.getDate(),
        calories: matching.reduce((s, m) => s + m.calories, 0),
        protein: matching.reduce((s, m) => s + m.protein, 0),
        fat: matching.reduce((s, m) => s + m.fat, 0),
        carbs: matching.reduce((s, m) => s + m.carbs, 0),
        count: matching.length,
      });
    }
    return result;
  }, [meals, weekOffset, language]);

  const weekAvg = useMemo(() => {
    const activeDays = weekDays.filter((d) => d.count > 0);
    if (activeDays.length === 0) return 0;
    return Math.round(
      activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length
    );
  }, [weekDays]);

  const daysOnTarget = useMemo(
    () => weekDays.filter((d) => d.count > 0 && d.calories <= dailyLimit).length,
    [weekDays, dailyLimit]
  );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requestHistory;
    return requestHistory.filter((item) =>
      item.dishName.toLowerCase().includes(q)
    );
  }, [requestHistory, searchQuery]);

  const maxWeekBar = Math.max(dailyLimit * 1.15, ...weekDays.map((d) => d.calories), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.diaryTitle}
        </h2>
      </div>

      {/* Segmented switcher: Daily | Weekly | AI History */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {([
          { id: 'daily', label: t.tabDaily },
          { id: 'weekly', label: t.tabWeekly },
          { id: 'requests', label: t.tabRequests },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              subTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DAILY VIEW */}
      {subTab === 'daily' && (
        <div className="space-y-4">
          {/* Horizontal date scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {dateChips.map((chip) => {
              const active = chip.dateStr === selectedDate;
              const hasMeals = meals.some((m) => m.dateStr === chip.dateStr);
              return (
                <button
                  key={chip.dateStr}
                  type="button"
                  onClick={() => onSelectDate(chip.dateStr)}
                  className={`min-w-[48px] min-h-[58px] px-2.5 py-2 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors border ${
                    active
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-[11px] opacity-80 capitalize">{chip.weekday}</span>
                  <span className="font-mono tabular-nums text-sm font-bold">{chip.dayNum}</span>
                  {hasMeals && !active && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day totals bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{selectedDate}</div>
              <div className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-white">
                {dayTotals.calories} / {dailyLimit} {t.kcal}
              </div>
            </div>
            <div className="text-right text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {t.protein}: {dayTotals.protein}{t.gramsShort} · {t.fat}: {dayTotals.fat}{t.gramsShort} · {t.carbs}: {dayTotals.carbs}{t.gramsShort}
            </div>
          </div>

          {/* Meals list with photos */}
          {dayMeals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noMealsForDate}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {dayMeals.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => setExpandedMeal(meal)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {meal.photoDataUrl ? (
                      <img
                        src={meal.photoDataUrl}
                        alt={meal.dishName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        <Utensils className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {getMealTypeText(language, meal.mealType)} ·{' '}
                        {new Date(meal.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {meal.dishName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {meal.protein}/{meal.fat}/{meal.carbs}{t.gramsShort} · {meal.weightGrams}{t.gramsShort}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {meal.calories} {t.kcal}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeal(meal.id);
                      }}
                      aria-label={t.deleteMeal}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WEEKLY VIEW */}
      {subTab === 'weekly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {t.weeklySummary}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={weekOffset === 0}
                  onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t.weeklyAvg}</div>
                <div className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {weekAvg} {t.kcal}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t.weeklyDaysInGoal}</div>
                <div className="font-mono tabular-nums text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {daysOnTarget} {t.ofDays}
                </div>
              </div>
            </div>

            {/* 7-day bar list */}
            <div className="space-y-2.5 pt-2">
              {weekDays.map((day) => {
                const pct = Math.min(100, Math.round((day.calories / maxWeekBar) * 100));
                const over = day.calories > dailyLimit;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      onSelectDate(day.dateStr);
                      setSubTab('daily');
                    }}
                    className="w-full min-h-[44px] flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 py-1 transition-colors"
                  >
                    <div className="w-14 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {day.label} {day.dayNum}
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          over ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-20 text-right font-mono tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {day.calories} {t.kcal}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI REQUEST HISTORY VIEW */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchHistoryPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t.noRequestHistory}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {filteredRequests.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.photoDataUrl ? (
                      <img
                        src={entry.photoDataUrl}
                        alt={entry.dishName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        <Utensils className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {entry.dishName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {entry.calories} {t.kcal} · {entry.weightGrams}{t.gramsShort}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReuseRequest(entry)}
                    className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addAgainToday}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded Meal Photo & Breakdown Modal */}
      {expandedMeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">{t.mealDetails}</h3>
              <button
                type="button"
                onClick={() => setExpandedMeal(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 pb-safe">
              {expandedMeal.photoDataUrl && (
                <img
                  src={expandedMeal.photoDataUrl}
                  alt={expandedMeal.dishName}
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover rounded-2xl bg-slate-100 dark:bg-slate-800"
                />
              )}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {expandedMeal.dateStr} · {getMealTypeText(language, expandedMeal.mealType)}
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {expandedMeal.dishName}
                </h4>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">{t.kcal}</div>
                  <div className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    {expandedMeal.calories}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">{t.protein}</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {expandedMeal.protein}{t.gramsShort}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">{t.fat}</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {expandedMeal.fat}{t.gramsShort}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">{t.carbs}</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {expandedMeal.carbs}{t.gramsShort}
                  </div>
                </div>
              </div>
              {expandedMeal.ingredients.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t.ingredientsLabel}
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    {expandedMeal.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span>{ing.name}</span>
                        <span className="font-mono tabular-nums text-slate-500">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expandedMeal.aiTip && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {expandedMeal.aiTip}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
