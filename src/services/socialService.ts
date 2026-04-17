import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch } from 'firebase/firestore';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errors';

import { sendNotification } from './notificationService';

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

export const sendFriendRequest = async (currentUserId: string, targetUserId: string, currentUserName: string) => {
  try {
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, {
      friendRequests: arrayUnion(currentUserId)
    });
    
    await sendNotification(
      targetUserId,
      'friend_request',
      `${currentUserName} sent you a friend request!`,
      currentUserId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
  }
};

export const acceptFriendRequest = async (currentUserId: string, requesterId: string) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const requesterRef = doc(db, 'users', requesterId);

    const batch = writeBatch(db);
    
    // Add to each other's friends list, remove from requests
    batch.update(currentUserRef, {
      friends: arrayUnion(requesterId),
      friendRequests: arrayRemove(requesterId)
    });

    batch.update(requesterRef, {
      friends: arrayUnion(currentUserId)
    });
    
    await batch.commit();
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

    const batch = writeBatch(db);

    batch.update(currentUserRef, {
      friends: arrayRemove(friendId)
    });

    batch.update(friendRef, {
      friends: arrayRemove(currentUserId)
    });
    
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
  }
};
