import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { deleteApp } from 'firebase/app';

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
    // Re-authenticate if password provided (required for sensitive operations)
    if (password) {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
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

    // 5. Delete Firebase Auth user
    await deleteUser(user);

    return { success: true };
  } catch (error: any) {
    console.error('Delete account error:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      return { 
        success: false, 
        error: 'Please re-enter your password to confirm account deletion' 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to delete account. Please try again.' 
    };
  }
}

export async function exportUserData(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const uid = user.uid;
    
    // Fetch all user data
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
    const territories = await getDocs(query(collection(db, 'territories'), where('uid', '==', uid)));
    const sessions = await getDocs(query(collection(db, 'sessions'), where('uid', '==', uid)));
    const notifications = await getDocs(collection(db, 'users', uid, 'notifications'));

    const data = {
      profile: userDoc.docs[0]?.data() || {},
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