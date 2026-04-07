import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { User as CustomUser } from '../types';

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
    // Test connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    };
    testConnection();

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
      console.error("Error fetching user profile:", error);
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
