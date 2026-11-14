import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Smartphone, X } from 'lucide-react';

// Stable asset name, attached to every GitHub Release by .github/workflows/android-build.yml
export const APK_URL = 'https://github.com/Hemkumar247/Territory-Run/releases/latest/download/TerritoryRun.apk';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Web-only "Download App" entry. Renders nothing inside the installed Android app. */
export function PWAInstallButton({ variant = 'compact' }: { variant?: 'compact' | 'card' }) {
  const [showGuide, setShowGuide] = useState(false);

  if (Capacitor.isNativePlatform()) return null;

  const ios = isIOS();
  const label = ios ? 'Add to Home Screen' : 'Download App';
  const act = ios ? () => setShowGuide(true) : undefined;

  const content = variant === 'card' ? (
    <div className="glass-panel bg-white/90 dark:bg-black/40 rounded-2xl p-6 border border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-teal-500/15">
          <Smartphone className="h-5 w-5 text-teal-500" />
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{ios ? 'Install on iPhone' : 'Android App'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {ios ? 'Add Territory Run to your home screen' : 'Download the APK and run it as a native app'}
          </p>
        </div>
      </div>
      <Pill label={label} href={ios ? undefined : APK_URL} onClick={act} solid />
    </div>
  ) : (
    <Pill label={label} href={ios ? undefined : APK_URL} onClick={act} />
  );

  return (
    <>
      {content}
      {showGuide && <IOSGuide onClose={() => setShowGuide(false)} />}
    </>
  );
}

function Pill({ label, href, onClick, solid }: { label: string; href?: string; onClick?: () => void; solid?: boolean }) {
  const cls = solid
    ? 'shrink-0 flex items-center gap-2 rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-teal-600 transition-colors'
    : 'pointer-events-auto flex items-center gap-2 glass-panel bg-white/90 dark:bg-black/40 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-teal-500/30 hover:bg-white dark:hover:bg-black/60 transition-colors text-[10px] font-bold text-slate-700 dark:text-slate-200 tracking-[0.2em] uppercase';
  const inner = (
    <>
      <Download className="h-4 w-4" />
      {label}
    </>
  );
  return href ? (
    <a href={href} download rel="noopener" aria-label={label} className={cls}>{inner}</a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>{inner}</button>
  );
}

function IOSGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1117] p-6 shadow-2xl border border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-slate-500 hover:bg-black/5 dark:hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
          <li>Tap the <strong>Share</strong> button in the Safari toolbar.</li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
      </div>
    </div>
  );
}
