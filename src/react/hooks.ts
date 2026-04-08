import { useCallback } from 'react';

import { Adopture } from '../adopture';

import { useAdoptureContext } from './provider';

/** Returns the Adopture class for direct access to all static methods. */
export function useAdopture(): typeof Adopture {
  const { adopture } = useAdoptureContext();
  return adopture;
}

/** Returns a stable track function. */
export function useTrack(): (
  name: string,
  properties?: Record<string, string>,
) => void {
  useAdoptureContext(); // Ensure provider exists
  return useCallback(
    (name: string, properties?: Record<string, string>) => {
      Adopture.track(name, properties);
    },
    [],
  );
}

/** Returns a stable screen function. */
export function useScreen(): (
  name: string,
  properties?: Record<string, string>,
) => void {
  useAdoptureContext();
  return useCallback(
    (name: string, properties?: Record<string, string>) => {
      Adopture.screen(name, properties);
    },
    [],
  );
}

/** Returns a stable identify function. */
export function useIdentify(): (userId: string) => Promise<void> {
  useAdoptureContext();
  return useCallback((userId: string) => {
    return Adopture.identify(userId);
  }, []);
}
