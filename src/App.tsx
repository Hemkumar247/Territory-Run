/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { AuthScreen } from './components/AuthScreen';
import { MapScreen } from './components/MapScreen';
import { useEffect } from 'react';
import { requestNotificationPermission, listenToNotifications, markNotificationAsRead } from './services/notificationService';

function NotificationListener() {
  const { authUser, userProfile } = useFirebase();

  useEffect(() => {
    if (!authUser) return;

    // Request permission on load if logged in and enabled in preferences
    if (userProfile?.preferences?.notifications !== false) {
      requestNotificationPermission();
    }

    const shouldShow = userProfile?.preferences?.notifications !== false;

    const unsubscribe = listenToNotifications(authUser.uid, shouldShow, (notifications) => {
      notifications.forEach(notif => {
        setTimeout(() => {
          markNotificationAsRead(authUser.uid, notif.id);
        }, 5000);
      });
    });

    return () => unsubscribe();
  }, [authUser, userProfile?.preferences?.notifications]);

  return null;
}

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

  return (
    <>
      <NotificationListener />
      <MapScreen />
    </>
  );
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
