import { PushNotifications, PushNotificationSchema, Token, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema, LocalNotificationActionPerformed } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { capacitorGPS } from './capacitorGPS';

export interface PushConfig {
  fcmSenderId?: string;
}

type PushTokenCallback = (token: string) => void;
type NotificationCallback = (notification: PushNotificationSchema) => void;
type LocalNotificationCallback = (notification: LocalNotificationSchema) => void;

class CapacitorPush {
  private config: PushConfig = {};
  private tokenCallback: PushTokenCallback | null = null;
  private notificationCallback: NotificationCallback | null = null;
  private localNotificationCallback: LocalNotificationCallback | null = null;
  private initialized = false;

  async initialize(config?: PushConfig): Promise<void> {
    if (this.initialized) return;
    this.config = config || {};

    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token: Token) => {
        this.tokenCallback?.(token.value);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        this.notificationCallback?.(notification);
        this.handleNotification(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        this.handleAction(action);
      });

      await LocalNotifications.requestPermissions();

      LocalNotifications.addListener('localNotificationActionPerformed', (action: LocalNotificationActionPerformed) => {
        this.handleLocalAction(action);
      });

      App.addListener('appUrlOpen', (data: { url: string }) => {
        this.handleDeepLink(data.url);
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  onToken(callback: PushTokenCallback): void {
    this.tokenCallback = callback;
  }

  onNotification(callback: NotificationCallback): void {
    this.notificationCallback = callback;
  }

  onLocalNotification(callback: LocalNotificationCallback): void {
    this.localNotificationCallback = callback;
  }

  async showLocalNotification(notification: LocalNotificationSchema): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [notification],
    });
  }

  async showTerritoryContestedNotification(rivalName: string, territoryName: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Territory Contested!',
      body: `${rivalName} is contesting ${territoryName}`,
      id: Date.now(),
      extra: { type: 'territory_contested', rivalName, territoryName },
      actionTypeId: 'DEFEND',
      attachments: [],
    });
  }

  async showTerritoryLostNotification(rivalName: string, territoryName: string): Promise<void> {
    await this.showLocalNotification({
      title: 'Territory Lost',
      body: `${rivalName} claimed part of ${territoryName}`,
      id: Date.now(),
      extra: { type: 'territory_lost', rivalName, territoryName },
      actionTypeId: 'VIEW',
      attachments: [],
    });
  }

  async showRunCompleteNotification(distanceKm: number, areaM2: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Run Complete!',
      body: `You ran ${distanceKm.toFixed(2)}km and claimed ${Math.round(areaM2)}m²`,
      id: Date.now(),
      extra: { type: 'run_complete', distanceKm, areaM2 },
      actionTypeId: 'VIEW',
      attachments: [],
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await LocalNotifications.removeAllDeliveredNotifications();
    const pending = await LocalNotifications.getPending();
    await LocalNotifications.cancel(pending);
  }

  private handleNotification(notification: PushNotificationSchema): void {
    const data = notification.data;
    if (!data) return;

    switch (data.type) {
      case 'territory_contested':
        this.showTerritoryContestedNotification(data.rivalName, data.territoryName);
        break;
      case 'territory_lost':
        this.showTerritoryLostNotification(data.rivalName, data.territoryName);
        break;
      case 'run_complete':
        this.showRunCompleteNotification(data.distanceKm, data.areaM2);
        break;
    }
  }

  private handleAction(action: ActionPerformed): void {
    const data = action.notification.data;
    if (!data) return;

    if (action.actionId === 'DEFEND' || data.type === 'territory_contested') {
      if (data.lat && data.lng) {
        capacitorGPS.getCurrentPosition().then(pos => {
          // Navigate to territory
        });
      }
    }
  }

  private handleLocalAction(action: LocalNotificationActionPerformed): void {
    const data = action.notification.extra;
    if (!data) return;

    if (data.type === 'territory_contested' && data.lat && data.lng) {
      // Navigate to territory
    }
  }

  private handleDeepLink(url: string): void {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      const params = Object.fromEntries(parsed.searchParams);

      if (path.includes('/territory/')) {
        // Navigate to territory detail
      } else if (path.includes('/run/')) {
        // Navigate to run detail
      } else if (path.includes('/profile/')) {
        // Navigate to profile
      }
    } catch {
      // Invalid URL
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const capacitorPush = new CapacitorPush();