import { auth, db, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateRandomColor } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errors';

/**
 * Checks if a user profile exists in Firestore, and creates one if it doesn't.
 */
export const checkAndCreateUserProfile = async (user: FirebaseUser, customDisplayName?: string) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      const newUser = {
        uid: user.uid,
        displayName: customDisplayName || user.displayName || user.email?.split('@')[0] || 'Runner',
        email: user.email || '',
        territoryColor: generateRandomColor(),
        totalDistance: 0,
        territoryStrength: 0,
        lastActive: serverTimestamp(),
        wins: 0,
        losses: 0
      };
      
      await setDoc(userRef, newUser);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await checkAndCreateUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};
