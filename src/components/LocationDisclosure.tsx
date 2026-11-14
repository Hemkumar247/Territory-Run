import { MapPin } from 'lucide-react';
import { capacitorGPS } from '../services/capacitorGPS';

export const LOCATION_CONSENT_KEY = 'tr_location_disclosure_v1';

/**
 * Prominent in-app disclosure shown before the first run (Google Play location policy).
 * Must state what is collected, when, and why, and be accepted explicitly before any permission prompt.
 */
export function LocationDisclosure({ onAccept, onCancel }: { onAccept: () => void; onCancel: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="loc-title" className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1117] p-6 shadow-2xl border border-black/10 dark:border-white/10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/15">
          <MapPin className="h-7 w-7 text-teal-500" />
        </div>
        <h2 id="loc-title" className="text-center text-xl font-display font-bold text-slate-900 dark:text-white">
          Location during your runs
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Territory Run collects your <strong>precise location</strong> while a run is active, <strong>including when the
          screen is off or the app is in the background</strong>. We use it to record your route, measure distance and claim
          territory.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Collected only between Start and Stop. A notification stays visible while it runs.</li>
          <li>Not used for ads and never sold. Other players see territory outlines, not your raw GPS points.</li>
          <li>You can delete all of it by deleting your account.</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Tip: if tracking stops when the screen locks, set battery usage for Territory Run to "Unrestricted" in system settings.
          <button type="button" onClick={() => capacitorGPS.openSettings()} className="ml-1 underline">Open settings</button>
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-black/10 dark:border-white/10 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            Not now
          </button>
          <button type="button" onClick={onAccept} className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-teal-600">
            Agree & start
          </button>
        </div>
      </div>
    </div>
  );
}
