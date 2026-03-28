import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

/**
 * Firebase configuration loaded from environment variables when available,
 * falling back to the static applet config for local development.
 *
 * In production/staging, VITE_FIREBASE_* variables are injected at build
 * time by the CI/CD pipeline (see .github/workflows/ci-cd.yml).
 * Never commit real API keys — use the .env.*.example files as templates.
 */
function buildFirebaseConfig() {
  // Prefer environment variables (set via .env.* files or CI secrets)
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string | undefined,
    };
  }

  // Fallback: static config file (AI Studio / local dev without .env)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../firebase-applet-config.json') as {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL?: string;
    firestoreDatabaseId?: string;
  };
}

const firebaseConfig = buildFirebaseConfig();

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId ?? '(default)');
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

