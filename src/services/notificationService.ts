import { collection, doc, onSnapshot, query, setDoc, updateDoc, where, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errors';

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'territory_contested' | 'territory_lost';
  message: string;
  timestamp: any;
  read: boolean;
  relatedUserId?: string;
}

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/vite.svg', // Placeholder icon
      ...options
    });
  }
};

export const sendNotification = async (
  targetUserId: string, 
  type: AppNotification['type'], 
  message: string, 
  relatedUserId?: string
) => {
  try {
    const notifRef = doc(collection(db, 'users', targetUserId, 'notifications'));
    const notification: AppNotification = {
      id: notifRef.id,
      type,
      message,
      timestamp: serverTimestamp(),
      read: false,
      relatedUserId
    };
    
    await setDoc(notifRef, notification);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  try {
    const notifRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

let unsubscribeNotifications: (() => void) | null = null;

export const listenToNotifications = (
  userId: string, 
  shouldShowBrowserNotification: boolean,
  callback: (notifications: AppNotification[]) => void
) => {
  if (unsubscribeNotifications) {
    unsubscribeNotifications();
  }

  const q = query(
    collection(db, 'users', userId, 'notifications'),
    where('read', '==', false)
  );

  unsubscribeNotifications = onSnapshot(q, (snapshot) => {
    const notifications: AppNotification[] = [];
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as AppNotification;
        notifications.push(data);
        
        if (shouldShowBrowserNotification) {
          // Show browser notification for new ones
          // We check if timestamp is recent to avoid showing old unread ones on load
          const isRecent = data.timestamp && (Date.now() - data.timestamp.toMillis() < 10000);
          if (isRecent || !data.timestamp) { // !data.timestamp means it's a local optimistic update
            showBrowserNotification('Neon Run', {
              body: data.message,
              tag: data.id // Prevent duplicates
            });
          }
        }
      }
    });
    
    // Return all unread, sorted by timestamp descending locally
    const allUnread = snapshot.docs
      .map(doc => doc.data() as AppNotification)
      .sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || Date.now();
        const timeB = b.timestamp?.toMillis() || Date.now();
        return timeB - timeA;
      });
      
    callback(allUnread);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/notifications`);
  });

  return unsubscribeNotifications;
};
