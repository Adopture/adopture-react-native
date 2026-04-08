<p align="center">
  <a href="https://adopture.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://adopture.com/logo-dark.svg" />
      <img src="https://adopture.com/logo-light.svg" alt="Adopture" width="200" />
    </picture>
  </a>
</p>

<h3 align="center">Privacy-first mobile analytics</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/@adopture/react-native"><img src="https://img.shields.io/npm/v/@adopture/react-native.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@adopture/react-native"><img src="https://img.shields.io/npm/dm/@adopture/react-native.svg" alt="npm downloads" /></a>
  <a href="https://github.com/christopherarm/mobileanalytics/blob/main/packages/react-native-sdk/LICENSE"><img src="https://img.shields.io/npm/l/@adopture/react-native.svg" alt="license" /></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg" alt="platforms" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript" />
</p>

<p align="center">
  Lightweight analytics SDK for React Native & Expo.<br />
  No PII leaves the device. No cookies. No fingerprinting.
</p>

---

## Features

- **Privacy by design** -- device IDs are hashed daily/monthly with rotating salts. Raw IDs never leave the device.
- **Offline-first** -- events are queued in AsyncStorage and sent in batches with automatic retry.
- **Auto-capture** -- app installs, updates, opens, backgrounds, and sessions are tracked automatically.
- **Revenue tracking** -- purchases, renewals, trials, cancellations, and refunds with store detection.
- **React hooks** -- `useTrack`, `useScreen`, `useIdentify` with a simple Provider pattern.
- **React Navigation** -- automatic screen tracking with intelligent path normalization.
- **Tiny footprint** -- zero native modules, works with Expo out of the box.
- **Full TypeScript** -- strict types, declaration files, and IntelliSense support.

## Install

```sh
npx expo install @adopture/react-native @react-native-async-storage/async-storage react-native-get-random-values
```

<details>
<summary>Bare React Native (without Expo)</summary>

```sh
npm install @adopture/react-native @react-native-async-storage/async-storage react-native-get-random-values
cd ios && pod install
```

</details>

### Optional dependencies

| Package | Purpose |
|---------|---------|
| `@react-native-community/netinfo` | Pause sending when offline, auto-flush on reconnect |
| `@react-navigation/native` | Automatic screen tracking via `useAdoptureNavigationTracking` |
| `expo-localization` | Detect device locale |
| `expo-constants` | Detect app version |

## Quick start

### With React hooks (recommended)

```tsx
import { AdoptureProvider } from '@adopture/react-native/react';

export default function App() {
  return (
    <AdoptureProvider appKey="ak_your_app_key_here_000000">
      <MainApp />
    </AdoptureProvider>
  );
}
```

```tsx
import { useTrack, useIdentify } from '@adopture/react-native/react';

function MainApp() {
  const track = useTrack();
  const identify = useIdentify();

  const handleSignIn = async (userId: string) => {
    await identify(userId);
    track('signed_in', { method: 'email' });
  };

  return <Button title="Sign In" onPress={() => handleSignIn('user-123')} />;
}
```

### Without React hooks

```tsx
import { Adopture } from '@adopture/react-native';

// Initialize once at app startup
await Adopture.init({ appKey: 'ak_your_app_key_here_000000' });

// Track events
Adopture.track('button_pressed', { screen: 'home' });

// Track screen views
Adopture.screen('settings');

// Identify users (hashed automatically)
await Adopture.identify('user-123');
```

## Screen tracking with React Navigation

```tsx
import { useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { AdoptureProvider, useAdoptureNavigationTracking } from '@adopture/react-native/react';

function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  useAdoptureNavigationTracking(navigationRef);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* your screens */}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AdoptureProvider appKey="ak_your_app_key_here_000000">
      <AppNavigator />
    </AdoptureProvider>
  );
}
```

## Revenue tracking

```tsx
import { Adopture } from '@adopture/react-native';

// Initial purchase
Adopture.trackPurchase({
  productId: 'pro_monthly',
  price: 9.99,
  currency: 'USD',
  transactionId: 'txn_abc123',
});

// Subscription renewal
Adopture.trackRenewal({
  productId: 'pro_monthly',
  price: 9.99,
  currency: 'USD',
});

// Trial started
Adopture.trackTrialStarted({
  productId: 'pro_monthly',
  expirationAt: '2026-05-08T00:00:00Z',
});

// Trial converted to paid
Adopture.trackTrialConverted({
  productId: 'pro_monthly',
  price: 9.99,
  currency: 'USD',
});

// Cancellation
Adopture.trackCancellation({ productId: 'pro_monthly' });

// Refund
Adopture.trackRefund({
  productId: 'pro_monthly',
  price: 9.99,
  currency: 'USD',
});
```

## Configuration

```tsx
await Adopture.init({
  appKey: 'ak_your_app_key_here_000000',
  debug: false,            // Enable verbose logging + immediate sends
  autoCapture: true,       // Track lifecycle events automatically
  flushIntervalMs: 30000,  // Send batches every 30s
  flushAt: 20,             // Send when 20 events are queued
  maxQueueSize: 1000,      // Max events stored locally
  hashUserIds: true,       // Hash user IDs before sending
  appVersion: '1.2.0',     // Override auto-detected version
});
```

## Super properties

Attach properties to every event:

```tsx
// Set global properties
await Adopture.registerSuperProperties({
  app_variant: 'premium',
  build: 'production',
});

// Set only if not already set
await Adopture.registerSuperPropertiesOnce({
  first_open_date: new Date().toISOString(),
});

// Remove a property
await Adopture.unregisterSuperProperty('build');

// Clear all
await Adopture.clearSuperProperties();
```

## Opt-out / opt-in

```tsx
// Disable tracking (clears queue)
await Adopture.disable();

// Re-enable tracking
Adopture.enable();
```

## API reference

### Core

| Method | Description |
|--------|-------------|
| `Adopture.init(options)` | Initialize the SDK |
| `Adopture.track(name, properties?)` | Track a custom event |
| `Adopture.screen(name, properties?)` | Track a screen view |
| `Adopture.identify(userId)` | Associate a user ID (hashed by default) |
| `Adopture.logout()` | Clear user identity |
| `Adopture.flush()` | Send all queued events immediately |
| `Adopture.reset()` | Clear identity, queue, and session |
| `Adopture.disable()` / `enable()` | Opt-out / opt-in |
| `Adopture.shutdown()` | Flush and tear down the SDK |

### Revenue

| Method | Description |
|--------|-------------|
| `Adopture.trackPurchase(opts)` | Initial or first subscription purchase |
| `Adopture.trackOneTimePurchase(opts)` | Non-recurring purchase |
| `Adopture.trackRenewal(opts)` | Subscription renewal |
| `Adopture.trackTrialStarted(opts)` | Free trial started |
| `Adopture.trackTrialConverted(opts)` | Trial converted to paid |
| `Adopture.trackCancellation(opts)` | Subscription cancelled |
| `Adopture.trackRefund(opts)` | Refund processed |

### React hooks

```tsx
import {
  AdoptureProvider,
  useAdopture,
  useTrack,
  useScreen,
  useIdentify,
  useAdoptureNavigationTracking,
} from '@adopture/react-native/react';
```

| Hook | Returns |
|------|---------|
| `useAdopture()` | The `Adopture` class for direct access |
| `useTrack()` | Stable `(name, properties?) => void` |
| `useScreen()` | Stable `(name, properties?) => void` |
| `useIdentify()` | Stable `(userId) => Promise<void>` |
| `useAdoptureNavigationTracking(ref)` | Void -- auto-tracks screen changes |

## Auto-captured events

These events are tracked automatically when `autoCapture` is enabled (default):

| Event | When |
|-------|------|
| `app_installed` | First launch (no stored version) |
| `app_updated` | Launch with new app version |
| `app_opened` | App returns from background |
| `app_backgrounded` | App enters background |
| `session_start` | New session after 30 min inactivity |

## How privacy works

Adopture never sends raw device IDs or user IDs off-device. Instead, it generates three rotating hashes per device:

| Hash | Rotation | Used for |
|------|----------|----------|
| Daily | Every day | DAU counting |
| Monthly | Every month | MAU and retention |
| Retention | Every quarter | 90-day cohort analysis |

User IDs passed to `identify()` are hashed with SHA-256 before transmission (configurable via `hashUserIds`).

## Requirements

- React Native >= 0.70
- React >= 18
- Expo SDK 50+ (if using Expo)

## License

[MIT](./LICENSE)
