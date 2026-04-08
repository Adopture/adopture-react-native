import { useEffect, useRef } from 'react';

import { Adopture } from '../adopture';
import type { NavigationTracking } from '../navigation';

type NavigationRef = Parameters<typeof Adopture.createNavigationTracking>[0];

/**
 * Automatically tracks screen views using React Navigation.
 *
 * ```tsx
 * const navigationRef = useNavigationContainerRef();
 * useAdoptureNavigationTracking(navigationRef);
 *
 * return <NavigationContainer ref={navigationRef}>...</NavigationContainer>;
 * ```
 */
export function useAdoptureNavigationTracking(
  navigationRef: NavigationRef,
): void {
  const trackingRef = useRef<NavigationTracking | null>(null);

  useEffect(() => {
    if (!navigationRef || !Adopture.isInitialized) return;

    trackingRef.current = Adopture.createNavigationTracking(navigationRef);
    trackingRef.current.enable();

    return () => {
      trackingRef.current?.disable();
      trackingRef.current = null;
    };
  }, [navigationRef]);
}
