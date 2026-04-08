import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { BatchSender } from './batch-sender';
import { createConfig } from './config';
import type { AdoptureConfig } from './config';
import { collectContext } from './context-collector';
import { EventQueue } from './event-queue';
import { Hashing } from './hashing';
import { LifecycleObserver } from './lifecycle-observer';
import { log, setDebug } from './logger';
import { createNavigationTracking } from './navigation';
import type { NavigationTracking } from './navigation';
import { validateRevenueData } from './revenue';
import { SessionManager } from './session-manager';
import { SuperProperties } from './super-properties';
import type {
  AdoptureInitOptions,
  AnalyticsEvent,
  CancellationOptions,
  EventContext,
  EventType,
  PurchaseOptions,
  RefundOptions,
  RenewalOptions,
  RevenueData,
  Store,
  TrialConvertedOptions,
  TrialOptions,
} from './types';
import { generateUUID, utcTimestamp } from './utils';

const DEVICE_ID_KEY = '@adopture/device_id';
const USER_ID_KEY = '@adopture/user_id';
const APP_VERSION_KEY = '@adopture/app_version';

/** Privacy-first mobile analytics SDK for React Native & Expo. */
export class Adopture {
  private static instance: Adopture | null = null;

  private readonly config: AdoptureConfig;
  private readonly queue: EventQueue;
  private readonly sender: BatchSender;
  private readonly session: SessionManager;
  private readonly hashing: Hashing;
  private readonly superProps: SuperProperties;
  private lifecycleObserver: LifecycleObserver | null = null;

  private cachedContext: EventContext | null = null;
  private userId: string | null = null;
  private enabled = true;

  private constructor(
    config: AdoptureConfig,
    queue: EventQueue,
    sender: BatchSender,
    session: SessionManager,
    hashing: Hashing,
    superProps: SuperProperties,
  ) {
    this.config = config;
    this.queue = queue;
    this.sender = sender;
    this.session = session;
    this.hashing = hashing;
    this.superProps = superProps;
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Initializes the SDK. Must be called once before any tracking.
   *
   * ```ts
   * await Adopture.init({ appKey: 'ak_your_app_key' });
   * ```
   */
  static async init(options: AdoptureInitOptions): Promise<void> {
    const config = createConfig(options);
    setDebug(config.debug);

    const queue = new EventQueue(config.maxQueueSize);
    await queue.init();

    const sender = new BatchSender(config, queue);
    const session = new SessionManager();
    const superProps = new SuperProperties();
    await superProps.load();

    // Resolve device ID (persisted UUID)
    const deviceId = await Adopture.resolveDeviceId();
    const hashing = new Hashing(deviceId, config.appKey);

    const instance = new Adopture(
      config,
      queue,
      sender,
      session,
      hashing,
      superProps,
    );

    // Collect device context
    instance.cachedContext = await collectContext(config.appVersion);

    Adopture.instance = instance;

    // Restore persisted user identity
    instance.userId = await AsyncStorage.getItem(USER_ID_KEY);

    // Detect app install / update
    await instance.trackInstallOrUpdate();

    // Start auto-capture if enabled
    if (config.autoCapture) {
      instance.setupAutoCapture();
    }

    // Start flush timer
    sender.start();

    log(`Initialized with appKey: ${config.appKey.substring(0, 6)}...`);
  }

  // ---------------------------------------------------------------------------
  // Core Tracking
  // ---------------------------------------------------------------------------

  /** Tracks a custom event. */
  static track(name: string, properties?: Record<string, string>): void {
    Adopture.assertInitialized();
    if (!Adopture.instance!.enabled) return;
    Adopture.instance!.enqueue('track', name, properties ?? {});
  }

  /** Tracks a screen view. */
  static screen(name: string, properties?: Record<string, string>): void {
    Adopture.assertInitialized();
    if (!Adopture.instance!.enabled) return;
    Adopture.instance!.enqueue('screen', name, properties ?? {});
  }

  // ---------------------------------------------------------------------------
  // Revenue Tracking
  // ---------------------------------------------------------------------------

  /** Tracks a revenue event. */
  static trackRevenue(revenue: RevenueData): void {
    Adopture.assertInitialized();
    if (!Adopture.instance!.enabled) return;
    validateRevenueData(revenue);
    Adopture.instance!.enqueueRevenue(revenue);
  }

  /** Tracks an initial purchase (one-time or first subscription). */
  static trackPurchase(opts: PurchaseOptions): void {
    Adopture.trackRevenue({
      event_type: 'INITIAL_PURCHASE',
      product_id: opts.productId,
      price: opts.price,
      currency: opts.currency,
      transaction_id: opts.transactionId,
      store: opts.store,
    });
  }

  /** Tracks a one-time (non-recurring) purchase. */
  static trackOneTimePurchase(opts: PurchaseOptions): void {
    Adopture.trackRevenue({
      event_type: 'NON_RENEWING_PURCHASE',
      product_id: opts.productId,
      price: opts.price,
      currency: opts.currency,
      transaction_id: opts.transactionId,
      store: opts.store,
    });
  }

  /** Tracks a subscription renewal. */
  static trackRenewal(opts: RenewalOptions): void {
    Adopture.trackRevenue({
      event_type: 'RENEWAL',
      product_id: opts.productId,
      price: opts.price,
      currency: opts.currency,
      transaction_id: opts.transactionId,
      store: opts.store,
      expiration_at: opts.expirationAt,
    });
  }

  /** Tracks the start of a free trial. */
  static trackTrialStarted(opts: TrialOptions): void {
    Adopture.trackRevenue({
      event_type: 'TRIAL_STARTED',
      product_id: opts.productId,
      price: 0,
      currency: 'USD',
      is_trial: true,
      period_type: 'TRIAL',
      store: opts.store,
      expiration_at: opts.expirationAt,
    });
  }

  /** Tracks a trial-to-paid conversion. */
  static trackTrialConverted(opts: TrialConvertedOptions): void {
    Adopture.trackRevenue({
      event_type: 'TRIAL_CONVERTED',
      product_id: opts.productId,
      price: opts.price,
      currency: opts.currency,
      transaction_id: opts.transactionId,
      is_trial_conversion: true,
      store: opts.store,
    });
  }

  /** Tracks a subscription cancellation. */
  static trackCancellation(opts: CancellationOptions): void {
    Adopture.trackRevenue({
      event_type: 'CANCELLATION',
      product_id: opts.productId,
      price: 0,
      currency: 'USD',
      store: opts.store,
    });
  }

  /** Tracks a refund. */
  static trackRefund(opts: RefundOptions): void {
    Adopture.trackRevenue({
      event_type: 'REFUND',
      product_id: opts.productId,
      price: opts.price,
      currency: opts.currency,
      transaction_id: opts.transactionId,
      store: opts.store,
    });
  }

  // ---------------------------------------------------------------------------
  // Identity
  // ---------------------------------------------------------------------------

  /**
   * Associates a user ID with all subsequent events.
   * Persisted across app restarts. Hashed by default.
   */
  static async identify(userId: string): Promise<void> {
    Adopture.assertInitialized();
    const inst = Adopture.instance!;
    const effectiveId = inst.config.hashUserIds
      ? inst.hashing.hashUserId(userId)
      : userId;
    inst.userId = effectiveId;
    await AsyncStorage.setItem(USER_ID_KEY, effectiveId);
    log(`identify: ${effectiveId.substring(0, 8)}...`);
  }

  /**
   * Clears the user identity without affecting the session or queue.
   * Subsequent events will be anonymous until identify() is called again.
   */
  static async logout(): Promise<void> {
    Adopture.assertInitialized();
    Adopture.instance!.userId = null;
    await AsyncStorage.removeItem(USER_ID_KEY);
    log('logout: user identity cleared');
  }

  // ---------------------------------------------------------------------------
  // Queue Control
  // ---------------------------------------------------------------------------

  /** Flushes all queued events to the server immediately. */
  static async flush(): Promise<void> {
    Adopture.assertInitialized();
    await Adopture.instance!.sender.flush();
  }

  /** Resets all local state: clears user identity, queue, and starts a new session. */
  static async reset(): Promise<void> {
    Adopture.assertInitialized();
    const inst = Adopture.instance!;
    inst.userId = null;
    inst.session.startNewSession();
    await inst.queue.clear();
    await AsyncStorage.removeItem(USER_ID_KEY);
  }

  /** Disables all tracking (opt-out). */
  static async disable(): Promise<void> {
    Adopture.assertInitialized();
    const inst = Adopture.instance!;
    inst.enabled = false;
    inst.sender.stop();
    await inst.queue.clear();
  }

  /** Re-enables tracking after disable(). */
  static enable(): void {
    Adopture.assertInitialized();
    const inst = Adopture.instance!;
    inst.enabled = true;
    inst.sender.start();
  }

  /** Shuts down the SDK, flushing remaining events. */
  static async shutdown(): Promise<void> {
    if (!Adopture.instance) return;
    const inst = Adopture.instance;
    inst.lifecycleObserver?.unregister();
    inst.sender.stop();
    await inst.sender.flush();
    inst.sender.dispose();
    Adopture.instance = null;
  }

  // ---------------------------------------------------------------------------
  // Super Properties
  // ---------------------------------------------------------------------------

  /** Registers super properties that are sent with every event. Overwrites existing keys. */
  static async registerSuperProperties(
    props: Record<string, string>,
  ): Promise<void> {
    Adopture.assertInitialized();
    await Adopture.instance!.superProps.register(props);
  }

  /** Registers super properties only if the key is not already set. */
  static async registerSuperPropertiesOnce(
    props: Record<string, string>,
  ): Promise<void> {
    Adopture.assertInitialized();
    await Adopture.instance!.superProps.registerOnce(props);
  }

  /** Removes a single super property. */
  static async unregisterSuperProperty(key: string): Promise<void> {
    Adopture.assertInitialized();
    await Adopture.instance!.superProps.unregister(key);
  }

  /** Clears all super properties. */
  static async clearSuperProperties(): Promise<void> {
    Adopture.assertInitialized();
    await Adopture.instance!.superProps.clear();
  }

  /** Returns a read-only view of current super properties. */
  static get superProperties(): Record<string, string> {
    return Adopture.instance?.superProps.all ?? {};
  }

  // ---------------------------------------------------------------------------
  // State Inspection
  // ---------------------------------------------------------------------------

  static get isInitialized(): boolean {
    return Adopture.instance != null;
  }

  static get isEnabled(): boolean {
    return Adopture.instance?.enabled ?? false;
  }

  static get queueLength(): number {
    return Adopture.instance?.queue.length ?? 0;
  }

  static get sessionId(): string | undefined {
    return Adopture.instance?.session.sessionId;
  }

  static get deviceContext(): EventContext | undefined {
    return Adopture.instance?.cachedContext ?? undefined;
  }

  /** The API endpoint URL. */
  static get endpoint(): string {
    return Adopture.instance?.config.apiEndpoint ?? '';
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Creates a navigation tracking instance for React Navigation.
   * Attach it to your NavigationContainer's ref.
   */
  static createNavigationTracking(
    navigationRef: Parameters<typeof createNavigationTracking>[0],
  ): NavigationTracking {
    return createNavigationTracking(navigationRef, (name, properties) => {
      Adopture.screen(name, properties);
    });
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private enqueue(
    type: EventType,
    name: string,
    properties: Record<string, string>,
  ): void {
    const newSession = this.session.rotateIfNeeded();
    if (newSession && this.config.autoCapture) {
      this.enqueueRaw('track', 'session_start', {});
    }
    this.session.touch();
    this.enqueueRaw(type, name, properties);
  }

  private enqueueRaw(
    type: EventType,
    name: string,
    properties: Record<string, string>,
  ): void {
    // Merge: super props as base, event props override
    const mergedProps: Record<string, string> = {
      ...this.superProps.all,
      ...properties,
    };

    const event: AnalyticsEvent = {
      type,
      name,
      hashed_daily_id: this.hashing.dailyHash(),
      hashed_monthly_id: this.hashing.monthlyHash(),
      hashed_retention_id: this.hashing.retentionHash(),
      session_id: this.session.sessionId,
      timestamp: utcTimestamp(),
      properties: mergedProps,
      context: this.cachedContext!,
      ...(this.userId != null && { user_id: this.userId }),
    };

    this.queue.add(event).catch((e) => {
      log(`Failed to persist event: ${e}`);
    });

    if (this.config.debug) {
      log(`${type}: ${name}`);
      this.sender.flush().catch((e) => {
        log(`Debug flush failed: ${e}`);
      });
    } else if (this.queue.length >= this.config.flushAt) {
      this.sender.flush().catch((e) => {
        log(`Flush failed: ${e}`);
      });
    }
  }

  private enqueueRevenue(revenue: RevenueData): void {
    const newSession = this.session.rotateIfNeeded();
    if (newSession && this.config.autoCapture) {
      this.enqueueRaw('track', 'session_start', {});
    }
    this.session.touch();

    if (this.userId == null && this.config.debug) {
      log(
        'Warning: trackRevenue called without identify(). ' +
          'Revenue events without a user_id have limited analytics value.',
      );
    }

    // Auto-detect store from platform if not specified
    const effectiveStore = revenue.store ?? Adopture.detectStore();

    const event: AnalyticsEvent = {
      type: 'revenue',
      name: revenue.event_type,
      hashed_daily_id: this.hashing.dailyHash(),
      hashed_monthly_id: this.hashing.monthlyHash(),
      hashed_retention_id: this.hashing.retentionHash(),
      session_id: this.session.sessionId,
      timestamp: utcTimestamp(),
      properties: { ...this.superProps.all },
      context: this.cachedContext!,
      ...(this.userId != null && { user_id: this.userId }),
      revenue: {
        ...revenue,
        quantity: revenue.quantity ?? 1,
        store: effectiveStore,
      },
    };

    this.queue.add(event).catch((e) => {
      log(`Failed to persist revenue event: ${e}`);
    });

    if (this.config.debug) {
      log(
        `revenue: ${revenue.event_type} ${revenue.product_id} ${revenue.price} ${revenue.currency}`,
      );
      this.sender.flush().catch((e) => {
        log(`Debug flush failed: ${e}`);
      });
    } else if (this.queue.length >= this.config.flushAt) {
      this.sender.flush().catch((e) => {
        log(`Flush failed: ${e}`);
      });
    }
  }

  private static detectStore(): Store {
    if (Platform.OS === 'ios') return 'APP_STORE';
    if (Platform.OS === 'android') return 'PLAY_STORE';
    return 'OTHER';
  }

  private setupAutoCapture(): void {
    this.lifecycleObserver = new LifecycleObserver();
    this.lifecycleObserver.register(
      // onAppOpened
      () => {
        const newSession = this.session.rotateIfNeeded();
        if (newSession) {
          this.enqueueRaw('track', 'session_start', {});
        }
        this.enqueueRaw('track', 'app_opened', {});
      },
      // onAppBackgrounded
      () => {
        this.enqueueRaw('track', 'app_backgrounded', {});
        this.sender.flush().catch((e) => {
          log(`Background flush failed: ${e}`);
        });
      },
    );
  }

  private async trackInstallOrUpdate(): Promise<void> {
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    const currentVersion = this.cachedContext!.app_version;

    if (storedVersion == null) {
      this.enqueueRaw('track', 'app_installed', { version: currentVersion });
    } else if (storedVersion !== currentVersion) {
      this.enqueueRaw('track', 'app_updated', {
        previous_version: storedVersion,
        version: currentVersion,
      });
    }

    await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
  }

  private static async resolveDeviceId(): Promise<string> {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const generated = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
  }

  private static assertInitialized(): void {
    if (!Adopture.instance) {
      throw new Error('Adopture.init() must be called before using the SDK.');
    }
  }
}
