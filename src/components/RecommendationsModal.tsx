import React, { useState } from 'react';
import { X, Check, Calculator } from 'lucide-react';
import { Gender, Language, SportsFrequency, UserProfile, WorkActivity } from '../types';
import { translations } from '../i18n';
import { calculateCalorieRecommendation } from '../utils/calorieCalc';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  profile: UserProfile;
  onApplyLimit: (
    newLimit: number,
    updatedFields: Pick<
      UserProfile,
      'gender' | 'age' | 'weightKg' | 'heightCm' | 'workActivity' | 'doesSports' | 'sportsFrequency' | 'steps8kDaily'
    >
  ) => void;
}

export const RecommendationsModal: React.FC<RecommendationsModalProps> = ({
  isOpen,
  onClose,
  language,
  profile,
  onApplyLimit,
}) => {
  const t = translations[language];
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState<number>(profile.age);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [workActivity, setWorkActivity] = useState<WorkActivity>(profile.workActivity);
  const [doesSports, setDoesSports] = useState<boolean>(profile.doesSports);
  const [sportsFrequency, setSportsFrequency] = useState<SportsFrequency>(
    profile.doesSports ? (profile.sportsFrequency === 'none' ? '3-4' : profile.sportsFrequency) : 'none'
  );
  const [steps8kDaily, setSteps8kDaily] = useState<boolean>(profile.steps8kDaily);

  if (!isOpen) return null;

  const result = calculateCalorieRecommendation(
    {
      gender,
      age,
      weightKg,
      heightCm,
      workActivity,
      doesSports,
      sportsFrequency: doesSports ? sportsFrequency : 'none',
      steps8kDaily,
    },
    language
  );

  const handleApply = (limit: number) => {
    onApplyLimit(limit, {
      gender,
      age,
      weightKg,
      heightCm,
      workActivity,
      doesSports,
      sportsFrequency: doesSports ? sportsFrequency : 'none',
      steps8kDaily,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.recTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-safe">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.recSubtitle}
          </p>

          {/* Gender & Age / Body stats */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {t.genderLabel}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
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
                  className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                    gender === 'female'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.female}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                {t.ageLabel}
              </label>
              <input
                type="number"
                min={12}
                max={100}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
                className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Work activity */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t.workActivityLabel}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { id: 'sedentary', title: t.workSedentary, desc: t.workSedentaryDesc },
                { id: 'moderate', title: t.workModerate, desc: t.workModerateDesc },
                { id: 'active', title: t.workActive, desc: t.workActiveDesc },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWorkActivity(item.id)}
                  className={`min-h-[48px] text-left px-4 py-2.5 rounded-2xl border transition-colors ${
                    workActivity === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sports Yes/No + Frequency */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {t.sportsQuestion}
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 w-36">
                <button
                  type="button"
                  onClick={() => {
                    setDoesSports(true);
                    if (sportsFrequency === 'none') setSportsFrequency('3-4');
                  }}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                    doesSports
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.yes}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDoesSports(false);
                    setSportsFrequency('none');
                  }}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                    !doesSports
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.no}
                </button>
              </div>
            </div>

            {doesSports && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t.sportsFreqLabel}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: '1-2', label: t.freq1_2 },
                    { id: '3-4', label: t.freq3_4 },
                    { id: '5+', label: t.freq5plus },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSportsFrequency(opt.id)}
                      className={`min-h-[44px] px-2 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        sportsFrequency === opt.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 8,000+ Steps Yes/No */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {t.stepsQuestion}
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 w-36">
              <button
                type="button"
                onClick={() => setSteps8kDaily(true)}
                className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                  steps8kDaily
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.yes}
              </button>
              <button
                type="button"
                onClick={() => setSteps8kDaily(false)}
                className={`min-h-[36px] rounded-lg text-xs font-semibold transition-colors ${
                  !steps8kDaily
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.no}
              </button>
            </div>
          </div>

          {/* Calculated Recommendation Result */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {t.recResultTitle}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {result.summary}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApply(result.loseCalories)}
                className="min-h-[76px] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-emerald-500 transition-colors text-left flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.goalLose}
                </span>
                <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                  {result.loseCalories}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleApply(result.maintenanceCalories)}
                className="min-h-[76px] p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 transition-colors text-left flex flex-col justify-between"
              >
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {t.goalMaintain}
                </span>
                <span className="font-mono tabular-nums text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {result.maintenanceCalories}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleApply(result.gainCalories)}
                className="min-h-[76px] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-emerald-500 transition-colors text-left flex flex-col justify-between"
              >
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {t.goalGain}
                </span>
                <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                  {result.gainCalories}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {t.protein}: {result.macrosMaintain.protein}{t.gramsShort} · {t.fat}: {result.macrosMaintain.fat}{t.gramsShort} · {t.carbs}: {result.macrosMaintain.carbs}{t.gramsShort}
            </div>

            <button
              type="button"
              onClick={() => handleApply(result.maintenanceCalories)}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>
                {t.applyLimit} ({result.maintenanceCalories} {t.kcal})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
