/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { AuthScreen } from './components/AuthScreen';
import { MapScreen } from './components/MapScreen';

function Main() {
  const { isAuthReady, authUser } = useFirebase();

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/20 border-t-teal-500"></div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen />;
  }

  return <MapScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Main />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
