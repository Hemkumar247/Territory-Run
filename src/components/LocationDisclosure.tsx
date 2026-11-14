import { MapPin } from 'lucide-react';
import { capacitorGPS } from '../services/capacitorGPS';

export const LOCATION_CONSENT_KEY = 'tr_location_disclosure_v1';

type DisclosureVariant = 'entry' | 'services-off' | 'run';

const COPY: Record<DisclosureVariant, { title: string; body: string; accept: string }> = {
  entry: {
    title: 'Use your location',
    body: 'Territory Run needs your precise location to open the map on the streets around you, the same way a ride app does. While a run is active it keeps recording if the screen turns off, so the route, distance and territory match where you actually went.',
    accept: 'Allow location',
  },
  'services-off': {
    title: 'Turn on location',
    body: 'Location is switched off on this phone, so the map cannot show where you are. Turn on Location, then allow Territory Run to use precise location.',
    accept: 'Open settings',
  },
  run: {
    title: 'Location during your runs',
    body: 'Territory Run collects your precise location while a run is active, including when the screen is off or the app is in the background. We use it to record your route, measure distance and claim territory.',
    accept: 'Agree & start',
  },
};

/**
 * Shown at login when location is missing, and once before the first run.
 * The system permission dialog is opened from the accept button.
 */
export function LocationDisclosure({
  onAccept,
  onCancel,
  variant = 'run',
}: {
  onAccept: () => void;
  onCancel: () => void;
  variant?: DisclosureVariant;
}) {
  const copy = COPY[variant];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="loc-title" className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0D1117] p-6 shadow-2xl border border-black/10 dark:border-white/10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/15">
          <MapPin className="h-7 w-7 text-teal-500" />
        </div>
        <h2 id="loc-title" className="text-center text-xl font-display font-bold text-slate-900 dark:text-white">
          {copy.title}
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{copy.body}</p>
        {variant === 'run' && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
            <li>Collected only between Start and Stop. A notification stays visible while it runs.</li>
            <li>Not used for ads and never sold. Friends see your live spot only while you are on a run.</li>
            <li>You can delete all of it by deleting your account.</li>
          </ul>
        )}
        {variant !== 'services-off' && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            If tracking stops when the screen locks, set battery usage for Territory Run to Unrestricted.
            <button type="button" onClick={() => capacitorGPS.openSettings()} className="ml-1 underline">Open settings</button>
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-black/10 dark:border-white/10 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            Not now
          </button>
          <button type="button" onClick={onAccept} className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-teal-600">
            {copy.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
