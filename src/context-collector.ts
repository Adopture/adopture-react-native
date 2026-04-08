import { Dimensions, NativeModules, Platform } from 'react-native';

import type { EventContext } from './types';

/** Collects non-PII device context once on init. */
export async function collectContext(appVersion: string): Promise<EventContext> {
  const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const osVersion = getOsVersion();
  const { width, height } = Dimensions.get('window');
  const locale = getLocale().substring(0, 10); // Backend max: 10 chars
  const deviceType = getDeviceType();

  return {
    os,
    os_version: osVersion,
    app_version: appVersion || await detectAppVersion(),
    locale,
    device_type: deviceType,
    screen_width: Math.round(width),
    screen_height: Math.round(height),
  };
}

function getLocale(): string {
  try {
    // Try expo-localization at runtime (if available)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const expoLocalization = require('expo-localization');
    if (expoLocalization?.getLocales) {
      const locales = expoLocalization.getLocales();
      if (locales?.[0]?.languageTag) return locales[0].languageTag;
    }
  } catch {
    // Not available — fall through
  }

  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const locale =
        settings?.AppleLocale || settings?.AppleLanguages?.[0];
      if (locale) return locale;
    } else {
      const locale = NativeModules.I18nManager?.localeIdentifier;
      if (locale) return locale;
    }
  } catch {
    // Fall through
  }

  return 'en_US';
}

function getOsVersion(): string {
  if (Platform.OS === 'ios') {
    return String(Platform.Version);
  }
  // Android: Platform.Version is API level (e.g., 34).
  // Map common API levels to marketing versions for consistency with Flutter SDK.
  const apiLevel = Number(Platform.Version);
  const apiToVersion: Record<number, string> = {
    35: '15', 34: '14', 33: '13', 32: '12L', 31: '12', 30: '11',
    29: '10', 28: '9', 27: '8.1', 26: '8.0',
  };
  return apiToVersion[apiLevel] ?? String(apiLevel);
}

function getDeviceType(): string {
  if (Platform.OS === 'ios') {
    return (Platform as any).isPad ? 'iPad' : 'iPhone';
  }
  // Android: use screen dimensions heuristic
  const { width, height } = Dimensions.get('screen');
  const diag = Math.sqrt(width * width + height * height);
  return diag > 900 ? 'Android Tablet' : 'Android Phone';
}

async function detectAppVersion(): Promise<string> {
  try {
    // Try expo-constants at runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.version || Constants?.manifest?.version || '';
  } catch {
    return '';
  }
}
