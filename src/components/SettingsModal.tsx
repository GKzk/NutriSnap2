import React, { useState } from 'react';
import { X, Sun, Moon, Globe, RotateCcw } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { translations } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  profile: UserProfile;
  onUpdateLimit: (limit: number) => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  profile,
  onUpdateLimit,
  onResetAll,
}) => {
  const t = translations[settings.language];
  const [limitInput, setLimitInput] = useState(String(profile.dailyCalorieLimit));
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveLimit = () => {
    const parsed = Math.max(800, Math.min(8000, Number(limitInput) || profile.dailyCalorieLimit));
    onUpdateLimit(parsed);
    setLimitInput(String(parsed));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.settingsTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 pb-safe">
          {/* Language switcher */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Globe className="w-4 h-4" />
              <span>{t.languageLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'ru' })}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                  settings.language === 'ru'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Русский
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                  settings.language === 'en'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Theme switcher */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t.themeLabel}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`min-h-[44px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>{t.themeLight}</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`min-h-[44px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>{t.themeDark}</span>
              </button>
            </div>
          </div>

          {/* Manual daily calorie limit */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t.dailyLimitLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={800}
                max={8000}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="flex-1 min-h-[44px] font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveLimit}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
              >
                {t.save}
              </button>
            </div>
          </div>

          {/* Reset data */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetData}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-center text-rose-600 dark:text-rose-400 font-medium">
                  {t.resetConfirm}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingReset(false);
                      onResetAll();
                      onClose();
                    }}
                    className="min-h-[44px] rounded-xl bg-rose-600 text-white text-sm font-semibold"
                  >
                    {t.resetData}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
