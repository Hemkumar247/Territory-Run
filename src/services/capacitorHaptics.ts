import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export interface HapticPattern {
  type: 'impact' | 'notification' | 'vibrate';
  style?: ImpactStyle;
  notificationType?: NotificationType;
  duration?: number;
}

class CapacitorHaptics {
  async impact(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch {
      this.fallbackVibrate(30);
    }
  }

  async notification(type: NotificationType = NotificationType.Success): Promise<void> {
    try {
      await Haptics.notification({ type });
    } catch {
      this.fallbackVibrate(type === NotificationType.Success ? 50 : 100);
    }
  }

  async vibrate(duration: number): Promise<void> {
    try {
      await Haptics.vibrate({ duration });
    } catch {
      this.fallbackVibrate(duration);
    }
  }

  async selectionStart(): Promise<void> {
    try {
      await Haptics.selectionStart();
    } catch {
      this.fallbackVibrate(10);
    }
  }

  async selectionChanged(): Promise<void> {
    try {
      await Haptics.selectionChanged();
    } catch {
      this.fallbackVibrate(10);
    }
  }

  async selectionEnd(): Promise<void> {
    try {
      await Haptics.selectionEnd();
    } catch {
      this.fallbackVibrate(10);
    }
  }

  async runPattern(pattern: HapticPattern[]): Promise<void> {
    for (const p of pattern) {
      switch (p.type) {
        case 'impact':
          await this.impact(p.style || ImpactStyle.Medium);
          break;
        case 'notification':
          await this.notification(p.notificationType || NotificationType.Success);
          break;
        case 'vibrate':
          await this.vibrate(p.duration || 30);
          break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }

  private fallbackVibrate(duration: number): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignore
      }
    }
  }

  // Predefined patterns for the app
  async runStart(): Promise<void> {
    await this.runPattern([
      { type: 'impact', style: ImpactStyle.Heavy },
      { type: 'vibrate', duration: 40 },
    ]);
  }

  async runPause(): Promise<void> {
    await this.impact(ImpactStyle.Light);
  }

  async runResume(): Promise<void> {
    await this.runPattern([
      { type: 'impact', style: ImpactStyle.Medium },
      { type: 'impact', style: ImpactStyle.Light },
    ]);
  }

  async runStop(): Promise<void> {
    await this.notification(NotificationType.Success);
  }

  async achievementUnlocked(): Promise<void> {
    await this.runPattern([
      { type: 'notification', notificationType: NotificationType.Success },
      { type: 'impact', style: ImpactStyle.Heavy },
      { type: 'impact', style: ImpactStyle.Medium },
    ]);
  }

  async territoryClaimed(): Promise<void> {
    await this.runPattern([
      { type: 'impact', style: ImpactStyle.Heavy },
      { type: 'vibrate', duration: 30 },
      { type: 'impact', style: ImpactStyle.Heavy },
    ]);
  }

  async territoryContested(): Promise<void> {
    await this.runPattern([
      { type: 'notification', notificationType: NotificationType.Warning },
      { type: 'vibrate', duration: 100 },
    ]);
  }

  async territoryLost(): Promise<void> {
    await this.runPattern([
      { type: 'notification', notificationType: NotificationType.Error },
      { type: 'vibrate', duration: 150 },
    ]);
  }

  async buttonPress(): Promise<void> {
    await this.impact(ImpactStyle.Light);
  }

  async error(): Promise<void> {
    await this.notification(NotificationType.Error);
  }
}

export const capacitorHaptics = new CapacitorHaptics();