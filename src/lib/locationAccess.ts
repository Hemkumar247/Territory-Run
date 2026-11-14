export type LocationAccess = 'precise' | 'approximate' | 'denied' | 'disabled' | 'prompt';

export function toLocationAccess(
  perm?: { location?: string; coarseLocation?: string },
  error?: unknown
): LocationAccess {
  if (perm?.location === 'granted') return 'precise';
  if (perm?.coarseLocation === 'granted') return 'approximate';
  if (perm?.location === 'prompt' || perm?.coarseLocation === 'prompt') return 'prompt';

  const message = error instanceof Error ? error.message : String(error || '');
  if (/not enabled|services are disabled|disabled|OS-PLUG-GLOC-0007/i.test(message)) return 'disabled';
  if (/prompt/i.test(message)) return 'prompt';
  return 'denied';
}

export function locationGranted(access: LocationAccess | 'checking'): boolean {
  return access === 'precise' || access === 'approximate';
}
