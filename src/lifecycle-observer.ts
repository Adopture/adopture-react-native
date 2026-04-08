import { AppState } from 'react-native';
import type { NativeEventSubscription, AppStateStatus } from 'react-native';

/** Observes app lifecycle changes and triggers callbacks. */
export class LifecycleObserver {
  private subscription: NativeEventSubscription | null = null;
  private lastState: AppStateStatus = AppState.currentState;

  register(
    onAppOpened: () => void,
    onAppBackgrounded: () => void,
  ): void {
    this.unregister();

    this.subscription = AppState.addEventListener('change', (nextState) => {
      if (
        this.lastState.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        onAppOpened();
      } else if (
        this.lastState === 'active' &&
        nextState.match(/inactive|background/)
      ) {
        onAppBackgrounded();
      }
      this.lastState = nextState;
    });
  }

  unregister(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}
