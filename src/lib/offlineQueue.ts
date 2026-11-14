interface QueuedRun {
  id: string;
  userId: string;
  data: {
    trail: Array<{ lat: number; lng: number; timestamp: number }>;
    distanceMeters: number;
    territoryPolygon: Array<[number, number]>;
    territoryArea: number;
  };
  timestamp: number;
  retries: number;
  synced: boolean;
}

const DB_NAME = 'territory-run-offline';
const STORE_NAME = 'queued-runs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
}

export async function queueRunForSync(
  userId: string,
  data: QueuedRun['data']
): Promise<string> {
  const db = await openDB();
  const run: QueuedRun = {
    id: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId,
    data,
    timestamp: Date.now(),
    retries: 0,
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(run);
    request.onsuccess = () => resolve(run.id);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedRuns(userId: string): Promise<QueuedRun[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const runs = request.result as QueuedRun[];
      resolve(runs.filter(r => r.userId === userId && !r.synced));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markRunSynced(runId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(runId);
    getRequest.onsuccess = () => {
      const run = getRequest.result as QueuedRun | undefined;
      if (run) {
        run.synced = true;
        const putRequest = store.put(run);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function incrementRetry(runId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(runId);
    getRequest.onsuccess = () => {
      const run = getRequest.result as QueuedRun | undefined;
      if (run) {
        run.retries += 1;
        const putRequest = store.put(run);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearSyncedRuns(userId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const runs = request.result as QueuedRun[];
      runs
        .filter(r => r.userId === userId && r.synced)
        .forEach(r => store.delete(r.id));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function syncQueuedRuns(
  userId: string,
  saveFn: (data: QueuedRun['data']) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const runs = await getQueuedRuns(userId);
  let synced = 0;
  let failed = 0;

  for (const run of runs) {
    if (run.retries >= 5) {
      failed++;
      continue;
    }

    try {
      await saveFn(run.data);
      await markRunSynced(run.id);
      synced++;
    } catch {
      await incrementRetry(run.id);
      failed++;
    }
  }

  await clearSyncedRuns(userId);
  return { synced, failed };
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export function registerOnlineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}