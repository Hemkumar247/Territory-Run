import { collection, doc, onSnapshot, query, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'territory_contested' | 'territory_lost';
  message: string;
  timestamp: any;
  read: boolean;
  relatedUserId?: string;
  data?: any;
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

export const showBrowserNotification = async (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notificationOptions: NotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, notificationOptions);
        return;
      }
    }
    new Notification(title, notificationOptions);
  } catch {
    // Ignore notification errors in restricted WebViews
  }
};

export const sendNotification = async (
  targetUserId: string, 
  type: AppNotification['type'], 
  message: string, 
  relatedUserId?: string,
  data?: any
) => {
  try {
    const notifRef = doc(collection(db, 'users', targetUserId, 'notifications'));
    // Firestore rejects `undefined`, so only include optional fields when present.
    await setDoc(notifRef, {
      id: notifRef.id,
      type,
      message: message.slice(0, 200),
      timestamp: serverTimestamp(),
      read: false,
      ...(relatedUserId ? { relatedUserId } : {}),
      ...(data ? { data } : {}),
    });
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
    const newNotifications: AppNotification[] = [];
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as AppNotification;
        newNotifications.push(data);
        
        if (shouldShowBrowserNotification) {
          // Show browser notification for new ones
          // We check if timestamp is recent to avoid showing old unread ones on load
          const isRecent = data.timestamp && (Date.now() - data.timestamp.toMillis() < 10000);
          if (isRecent || !data.timestamp) { // !data.timestamp means it's a local optimistic update
            showBrowserNotification('Territory Run', {
              body: data.message,
              tag: data.id // Prevent duplicates
            });
          }
        }
      }
    });
    
    // Only pass NEW notifications to callback (dynamic, not persistent)
    callback(newNotifications);
  }, (error) => {
    console.error('notifications listener:', error.code);
  });

  return unsubscribeNotifications;
};
