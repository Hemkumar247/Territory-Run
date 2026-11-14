import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseAuthUser, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { User as CustomUser } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errors';
import { checkAndCreateUserProfile } from '../services/authService';

interface FirebaseContextType {
  authUser: FirebaseAuthUser | null;
  userProfile: CustomUser | null;
  isAuthReady: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  authUser: null,
  userProfile: null,
  isAuthReady: false,
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<CustomUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Web only: finish a redirect-based Google sign-in. Native uses the Google account picker instead.
    if (!Capacitor.isNativePlatform()) {
      getRedirectResult(auth)
        .then((result) => (result?.user ? checkAndCreateUserProfile(result.user) : undefined))
        .catch((error) => console.error('Redirect Sign-In Error:', error?.code || error));
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setAuthUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'users', authUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as CustomUser);
      }
      setIsAuthReady(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
      setIsAuthReady(true);
    });

    return () => unsubscribeProfile();
  }, [authUser]);

  return (
    <FirebaseContext.Provider value={{ authUser, userProfile, isAuthReady }}>
      {children}
    </FirebaseContext.Provider>
  );
};
