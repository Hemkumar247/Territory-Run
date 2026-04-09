import { auth, db, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateRandomColor } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errors';

export const generateFriendCode = () => {
  // Generate a random 6-character alphanumeric code
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

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
        territoryColor: generateRandomColor(),
        totalDistance: 0,
        territoryStrength: 0,
        lastActive: serverTimestamp(),
        wins: 0,
        losses: 0,
        friendCode: generateFriendCode(),
        friends: [],
        friendRequests: []
      };
      
      await setDoc(userRef, newUser);
    } else {
      // Backwards compatibility: add friendCode if it doesn't exist
      const data = docSnap.data();
      if (!data.friendCode) {
        await updateDoc(userRef, {
          friendCode: generateFriendCode(),
          friends: data.friends || [],
          friendRequests: data.friendRequests || []
        });
      }
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
