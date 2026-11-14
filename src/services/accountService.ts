import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { clearLocalCache, reauthenticateWithGoogle } from './authService';
import { doc, getDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

export async function deleteAccount(password?: string): Promise<DeleteAccountResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'No authenticated user' };
  }

  try {
    // Re-authenticate BEFORE touching any data, so a failure never leaves a half-deleted account.
    if (user.providerData.some((p) => p.providerId === 'password')) {
      if (!password || !user.email) {
        return { success: false, error: 'Please enter your password to confirm.' };
      }
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    } else {
      await reauthenticateWithGoogle(user);
    }

    const uid = user.uid;

    // 1. Delete user's territories
    const territoriesRef = collection(db, 'territories');
    const territoriesQuery = query(territoriesRef, where('uid', '==', uid));
    const territoriesSnap = await getDocs(territoriesQuery);
    
    const batch = writeBatch(db);
    territoriesSnap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // 2. Delete user's sessions
    const sessionsRef = collection(db, 'sessions');
    const sessionsQuery = query(sessionsRef, where('uid', '==', uid));
    const sessionsSnap = await getDocs(sessionsQuery);
    sessionsSnap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // 3. Delete user's notifications
    const notifsRef = collection(db, 'users', uid, 'notifications');
    const notifsSnap = await getDocs(notifsRef);
    notifsSnap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // 4. Delete user document
    batch.delete(doc(db, 'users', uid));

    await batch.commit();

    // 5. Delete Firebase Auth user, then wipe local caches
    await deleteUser(user);
    await clearLocalCache(true);

    return { success: true };
  } catch (error: any) {
    console.error('Delete account error:', error);
    
    const code = error?.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return { success: false, error: 'Incorrect password.' };
    }
    if (code === 'auth/requires-recent-login') {
      return { success: false, error: 'Please sign in again, then retry.' };
    }
    return { success: false, error: 'Failed to delete account. Please try again.' };
  }
}

export async function exportUserData(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const uid = user.uid;
    
    // Fetch all user data
    const userDoc = await getDoc(doc(db, 'users', uid));
    const territories = await getDocs(query(collection(db, 'territories'), where('uid', '==', uid)));
    const sessions = await getDocs(query(collection(db, 'sessions'), where('uid', '==', uid)));
    const notifications = await getDocs(collection(db, 'users', uid, 'notifications'));

    const data = {
      profile: userDoc.data() || {},
      territories: territories.docs.map(d => d.data()),
      sessions: sessions.docs.map(d => d.data()),
      notifications: notifications.docs.map(d => d.data()),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Export data error:', error);
    return null;
  }
}