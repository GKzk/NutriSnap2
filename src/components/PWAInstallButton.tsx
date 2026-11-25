import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center space-x-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Установить</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center space-x-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>На iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Установка на iPhone</span>
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start space-x-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <Share className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>1. Нажмите кнопку <strong>«Поделиться»</strong> внизу экрана Safari.</span>
                </div>
                <div className="flex items-start space-x-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>2. Выберите <strong>«На экран „Домой“»</strong> и нажмите «Добавить».</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-sm font-bold text-slate-950 transition"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span>Офлайн-режим — история сохранена локально</span>
    </div>
  );
};
