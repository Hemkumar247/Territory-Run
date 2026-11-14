import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.territoryrun.app',
  appName: 'Territory Run',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#080B12',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#080B12',
      overlaysWebView: true,
    },
    Geolocation: {
      permissions: {
        location: 'when-in-use',
        locationAlways: 'always',
      },
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#00E5FF',
      sound: 'beep.wav',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAuthentication: {
      skipNativeAuth: true, // native Google picker only; session is created by the web SDK
      providers: ['google.com'],
    },
    Haptics: {},
    Device: {},
    Network: {},
    Preferences: {},
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#080B12',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#080B12',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;