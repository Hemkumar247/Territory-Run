/**
 * Re-applies two Android fixes after npm install:
 * 1. The geolocation plugin must show the permission dialog even if GPS is off.
 * 2. The background plugin must start its foreground service with the location type
 *    or Android 14+ drops GPS as soon as the screen locks.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const geolocation = 'node_modules/@capacitor/geolocation/android/src/main/kotlin/com/capacitorjs/plugins/geolocation/GeolocationPlugin.kt';
const background = 'node_modules/@capacitor-community/background-geolocation/android/src/main/java/com/equimaps/capacitor_background_geolocation/BackgroundGeolocationService.java';

function patch(path, from, to, already) {
  if (!existsSync(path)) {
    console.log(`skip ${path} (not installed)`);
    return;
  }
  const source = readFileSync(path, 'utf8');
  if (source.includes(already)) return;
  if (!source.includes(from)) {
    console.warn(`pattern missing in ${path}; patch not applied`);
    return;
  }
  writeFileSync(path, source.replace(from, to));
  console.log(`patched ${path}`);
}

patch(
  geolocation,
  `    override fun checkPermissions(call: PluginCall) {
        checkLocationState(call) { super.checkPermissions(call) }
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        checkLocationState(call) { super.requestPermissions(call) }
    }`,
  `    override fun checkPermissions(call: PluginCall) {
        // Do not require the GPS toggle to be on before reporting permission.
        // Otherwise the system dialog never appears when location services are off.
        super.checkPermissions(call)
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        // Ask for permission even if device location is currently switched off.
        // The enable-location dialog is handled by the position request that follows.
        super.requestPermissions(call)
    }`,
  'Ask for permission even if device location is currently switched off.'
);

patch(
  background,
  `            startForeground(NOTIFICATION_ID, notification);`,
  `            // targetSdk 34+ rejects a location foreground service that does not
            // pass FOREGROUND_SERVICE_TYPE_LOCATION, which stops GPS when the screen locks.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }`,
  'FOREGROUND_SERVICE_TYPE_LOCATION'
);
