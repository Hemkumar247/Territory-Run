import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch } from 'firebase/firestore';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errors';

import { sendNotification } from './notificationService';

/**
 * Retrieves a user profile by their unique friend code.
 * @param code - The 6-character alphanumeric friend code
 * @returns The matching User object or null if not found
 */
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

/**
 * Retrieves a user profile by their Firebase Auth UID.
 * @param uid - The structural document ID for the user
 * @returns The User object or null if not located
 */
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

/**
 * Sends a friend request to a target user and triggers a push notification.
 * @param currentUserId - The sender's UID
 * @param targetUserId - The recipient's UID
 * @param currentUserName - The sender's display name for the notification
 * @returns Promise that resolves when the update completes
 */
export const sendFriendRequest = async (currentUserId: string, targetUserId: string, currentUserName: string): Promise<void> => {
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

/**
 * Accepts an incoming friend request by mutual connection array arrays.
 * Operates under an atomic Firestore transaction batch.
 * @param currentUserId - The accepting user's UID
 * @param requesterId - The sender's UID
 * @returns void
 */
export const acceptFriendRequest = async (currentUserId: string, requesterId: string): Promise<void> => {
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

/**
 * Soft deletes an incoming friend request without notifying the sender.
 * @param currentUserId - The declining user's UID
 * @param requesterId - The sender's UID
 * @returns void
 */
export const declineFriendRequest = async (currentUserId: string, requesterId: string): Promise<void> => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    await updateDoc(currentUserRef, {
      friendRequests: arrayRemove(requesterId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUserId}`);
  }
};

/**
 * Bi-directionally severs a friend relationship by pulling uids from friend arrays safely.
 * @param currentUserId - The actor's UID
 * @param friendId - The target's UID
 * @returns void
 */
export const removeFriend = async (currentUserId: string, friendId: string): Promise<void> => {
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
