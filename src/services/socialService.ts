import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errors';

export const getUserByFriendCode = async (code: string): Promise<User | null> => {
  try {
    const q = query(collection(db, 'users'), where('friendCode', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), uid: snapshot.docs[0].id } as User;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users');
    return null;
  }
};

export const getUserByUid = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { ...docSnap.data(), uid: docSnap.id } as User;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return null;
  }
};

export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
  try {
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, {
      friendRequests: arrayUnion(currentUserId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
  }
};

export const acceptFriendRequest = async (currentUserId: string, requesterId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const requesterRef = doc(db, 'users', requesterId);

    // Add to each other's friends list, remove from requests
    await updateDoc(currentUserRef, {
      friends: arrayUnion(requesterId),
      friendRequests: arrayRemove(requesterId)
    });

    await updateDoc(requesterRef, {
      friends: arrayUnion(currentUserId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
  }
};

export const declineFriendRequest = async (currentUserId: string, requesterId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      friendRequests: arrayRemove(requesterId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
  }
};

export const removeFriend = async (currentUserId: string, friendId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const friendRef = doc(db, 'users', friendId);

    await updateDoc(currentUserRef, {
      friends: arrayRemove(friendId)
    });

    await updateDoc(friendRef, {
      friends: arrayRemove(currentUserId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
  }
};
