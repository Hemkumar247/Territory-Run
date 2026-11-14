import { auth, db, googleProvider } from '../lib/firebase';
import {
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { clearIndexedDbPersistence, doc, getDoc, serverTimestamp, setDoc, terminate, updateDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { generateRandomColor } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errors';

const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 6-char friend code from a CSPRNG (not guessable like Math.random). */
export const generateFriendCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => FRIEND_CODE_ALPHABET[b % FRIEND_CODE_ALPHABET.length]).join('');
};

/**
 * Turns any auth/Firestore failure into a short message that is safe to show.
 * Never leaks raw JSON, uids or emails, and does not reveal whether an email is registered.
 */
export const authErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'Could not create the account. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';
  }
  const message = (error as { message?: string })?.message || '';
  if (/cancel/i.test(message)) return 'Sign-in was cancelled.';
  return 'Something went wrong. Please try again.';
};

/**
 * Checks if a user profile exists in Firestore, and creates one if it doesn't.
 */
export const checkAndCreateUserProfile = async (user: FirebaseUser, customDisplayName?: string) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const name = (customDisplayName || user.displayName || user.email?.split('@')[0] || 'Runner').trim();
      await setDoc(userRef, {
        uid: user.uid,
        displayName: name.slice(0, 50) || 'Runner',
        territoryColor: generateRandomColor(),
        totalDistance: 0,
        territoryStrength: 0,
        lastActive: serverTimestamp(),
        wins: 0,
        losses: 0,
        currentStreak: 0,
        longestStreak: 0,
        friendCode: generateFriendCode(),
        friends: [],
        friendRequests: [],
      });
    } else {
      // Backwards compatibility: add friendCode if it doesn't exist
      const data = docSnap.data();
      if (!data.friendCode) {
        await updateDoc(userRef, {
          friendCode: generateFriendCode(),
          friends: data.friends || [],
          friendRequests: data.friendRequests || [],
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
  }
};

/** Native Google account picker (Android). Returns a Firebase credential for the web SDK. */
const nativeGoogleCredential = async () => {
  const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
  const { credential } = await FirebaseAuthentication.signInWithGoogle();
  if (!credential?.idToken) throw new Error('Google sign-in cancelled');
  return GoogleAuthProvider.credential(credential.idToken, credential.accessToken);
};

export const signInWithGoogle = async () => {
  // Google blocks OAuth inside embedded WebViews, so the APK must use the native picker.
  if (Capacitor.isNativePlatform()) {
    const result = await signInWithCredential(auth, await nativeGoogleCredential());
    await checkAndCreateUserProfile(result.user);
    return result.user;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    await checkAndCreateUserProfile(result.user);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

/** Re-authenticates a Google-only account before a sensitive action (e.g. deletion). */
export const reauthenticateWithGoogle = async (user: FirebaseUser) => {
  if (Capacitor.isNativePlatform()) {
    await reauthenticateWithCredential(user, await nativeGoogleCredential());
  } else {
    await reauthenticateWithPopup(user, googleProvider);
  }
};

/**
 * Wipes locally cached Firestore data (profiles, territories of other players) so the next
 * person on a shared device cannot read it. Must be followed by a page reload.
 */
export const clearLocalCache = async (alsoOfflineRuns = false) => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    if (alsoOfflineRuns) indexedDB.deleteDatabase('territory-run-offline');
  } catch (error) {
    console.error('Cache clear failed:', error);
  }
};

export const logout = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut().catch(() => undefined);
    }
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
  await clearLocalCache();
  window.location.reload();
};
