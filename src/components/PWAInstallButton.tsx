import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15">
                <Smartphone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Android / Mobile App</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Installed & running in app mode</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'card') {
    return (
      <>
        <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/15">
                <Smartphone className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Install Android App</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isInstallable
                    ? 'Add Territory Run to your home screen'
                    : 'Run fullscreen with offline caching & wake lock'}
                </p>
              </div>
            </div>
            <button
              onClick={handleAction}
              className="shrink-0 flex items-center gap-2 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          </div>
        </div>

        {showGuide && <InstallGuideModal isIOS={isIOS} isAndroid={isAndroid} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  // Compact header/auth button: show directly when native prompt is ready or on iOS/Android
  if (isInstallable) {
    return (
      <button
        onClick={install}
        aria-label="Install Android App"
        className="pointer-events-auto flex items-center gap-2 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-teal-500/30 hover:bg-white dark:hover:bg-black/60 transition-colors"
      >
        <Download className="h-3.5 w-3.5 text-teal-500 dark:text-[#00E5FF]" />
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.2em] uppercase">
          Install App
        </span>
      </button>
    );
  }

  if (isIOS || isAndroid) {
    return (
      <>
        <button
          onClick={() => setShowGuide(true)}
          aria-label="Install Mobile App"
          className="pointer-events-auto flex items-center gap-2 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black/60 transition-colors"
        >
          <Download className="h-3.5 w-3.5 text-teal-500 dark:text-[#00E5FF]" />
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.2em] uppercase">
            {isIOS ? 'Add App' : 'Get App'}
          </span>
        </button>

        {showGuide && <InstallGuideModal isIOS={isIOS} isAndroid={isAndroid} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  return null;
};

function InstallGuideModal({
  isIOS,
  isAndroid,
  onClose,
}: {
  isIOS: boolean;
  isAndroid: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1117] p-6 shadow-2xl border border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
            {isIOS ? 'Install on iPhone / iPad' : 'Install on Android'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close install instructions"
            className="p-1.5 rounded-full text-slate-500 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isIOS ? (
          <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
            <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> to launch Territory Run fullscreen.</li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
            <li>Open this app in <strong>Google Chrome</strong> on Android{!isAndroid ? ' (or your Android browser)' : ''}.</li>
            <li>Tap the <strong>⋮ menu</strong> in the top-right corner.</li>
            <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong> to install it like a native Android app.</li>
          </ol>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-xs font-bold uppercase tracking-widest text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
        >
          Got It
        </button>
      </div>
    </div>
  );
}
