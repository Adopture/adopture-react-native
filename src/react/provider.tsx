import React, { createContext, useContext, useEffect, useState } from 'react';

import { Adopture } from '../adopture';
import type { AdoptureInitOptions } from '../types';

interface AdoptureContextValue {
  adopture: typeof Adopture;
  ready: boolean;
}

const AdoptureContext = createContext<AdoptureContextValue | null>(null);

export interface AdoptureProviderProps {
  /** App key for authentication. */
  appKey: string;
  /** Additional init options (excluding appKey). */
  options?: Omit<AdoptureInitOptions, 'appKey'>;
  children: React.ReactNode;
}

/**
 * Initializes Adopture on mount and provides it to child components.
 *
 * ```tsx
 * <AdoptureProvider appKey="ak_..." options={{ debug: true }}>
 *   <App />
 * </AdoptureProvider>
 * ```
 */
export function AdoptureProvider({
  appKey,
  options,
  children,
}: AdoptureProviderProps): React.JSX.Element {
  const [ready, setReady] = useState(Adopture.isInitialized);

  useEffect(() => {
    if (Adopture.isInitialized) {
      setReady(true);
      return;
    }

    let mounted = true;

    Adopture.init({ appKey, ...options })
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((err) => {
        console.error('[Adopture] Init failed:', err);
      });

    return () => {
      mounted = false;
      // Do NOT call Adopture.shutdown() here — the SDK singleton should persist
      // for the app's lifetime. Shutdown on unmount breaks React strict mode
      // (double-mount in dev) and hot reload scenarios.
    };
    // options is intentionally excluded: re-initialization is expensive and
    // rarely desired. Changing options requires an app restart.
  }, [appKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AdoptureContext.Provider value={{ adopture: Adopture, ready }}>
      {children}
    </AdoptureContext.Provider>
  );
}

/** Returns the Adopture context. Throws if used outside AdoptureProvider. */
export function useAdoptureContext(): AdoptureContextValue {
  const ctx = useContext(AdoptureContext);
  if (!ctx) {
    throw new Error('useAdopture must be used within an <AdoptureProvider>');
  }
  return ctx;
}
