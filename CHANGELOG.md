# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-04-08

### Fixed

- Fix broken logo image in README — use text header instead

## [0.1.0] - 2026-04-08

### Added

- Core analytics tracking (`track`, `screen`) with privacy-preserving hashed device IDs
- Session management with 30-minute inactivity timeout and automatic rotation
- Auto-capture of lifecycle events: `app_installed`, `app_updated`, `app_opened`, `app_backgrounded`, `session_start`
- Offline event queue with AsyncStorage persistence and automatic retry
- Batch event sending with exponential backoff (max 5 retries)
- Revenue tracking with 7 event types: `INITIAL_PURCHASE`, `RENEWAL`, `NON_RENEWING_PURCHASE`, `TRIAL_STARTED`, `TRIAL_CONVERTED`, `CANCELLATION`, `REFUND`
- User identity management with `identify()` and `logout()` (hashed by default)
- Super properties (global event properties) with persistence
- React integration: `AdoptureProvider`, `useAdopture`, `useTrack`, `useScreen`, `useIdentify`
- React Navigation integration: `useAdoptureNavigationTracking`
- Automatic screen name normalization (strips IDs, query params, normalizes paths)
- Network-aware sending via optional `@react-native-community/netinfo`
- Device context collection (OS, version, locale, screen dimensions, device type)
- Opt-out support via `disable()` / `enable()`
- Debug mode with immediate event sending and verbose logging
- Full TypeScript support with strict types and declaration files
- Dual CJS/ESM build output
- Expo and bare React Native support

[0.1.0]: https://github.com/christopherarm/mobileanalytics/releases/tag/react-native-sdk-v0.1.0
