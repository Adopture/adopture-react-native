/**
 * React Navigation screen tracking.
 *
 * Replaces Flutter's NavigatorObserver + GoRouterObserver.
 * Attaches to a NavigationContainerRef and tracks route changes.
 */

type NavigationRef = {
  getCurrentRoute(): { name?: string; path?: string } | undefined;
  addListener(event: string, callback: () => void): () => void;
};

export interface NavigationTracking {
  enable(): void;
  disable(): void;
}

/**
 * Creates a navigation tracking instance that listens to route changes
 * and calls the provided `onScreen` callback with the screen name.
 */
export function createNavigationTracking(
  navigationRef: NavigationRef,
  onScreen: (name: string, properties: Record<string, string>) => void,
): NavigationTracking {
  let lastRouteName: string | null = null;
  let unsubscribe: (() => void) | null = null;

  function handleStateChange(): void {
    const route = navigationRef.getCurrentRoute();
    if (!route) return;

    const name = route.name || route.path;
    if (!name) return;

    const screenName = formatScreenName(name);
    if (screenName === lastRouteName) return;

    lastRouteName = screenName;
    onScreen(screenName, { source: 'navigation_observer' });
  }

  function cleanup(): void {
    unsubscribe?.();
    unsubscribe = null;
    lastRouteName = null;
  }

  return {
    enable() {
      cleanup();
      unsubscribe = navigationRef.addListener('state', handleStateChange);
      // Track initial route
      handleStateChange();
    },
    disable() {
      cleanup();
    },
  };
}

/**
 * Converts a URI path or route name into a readable screen name.
 *
 * - `/` → `home`
 * - `/shopping-list` → `shopping-list`
 * - `/settings?tab=privacy` → `settings`
 * - `/users/a1b2c3d4e5f6g7h8i9j0` → `users/detail`
 */
export function formatScreenName(path: string): string {
  let name = path.startsWith('/') ? path.substring(1) : path;
  if (!name) return 'home';

  // Strip query params
  const q = name.indexOf('?');
  if (q !== -1) name = name.substring(0, q);

  // Strip fragment
  const h = name.indexOf('#');
  if (h !== -1) name = name.substring(0, h);

  // Strip trailing slash
  if (name.endsWith('/')) name = name.substring(0, name.length - 1);

  if (!name) return 'home';

  return normalizeDynamicSegments(name);
}

function normalizeDynamicSegments(path: string): string {
  const segments = path.split('/');
  const out: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    if (looksLikeId(segments[i]) && i > 0) {
      out.push('detail');
    } else {
      out.push(segments[i]);
    }
  }

  return out.join('/');
}

/** Heuristic: UUIDs (32+ chars with dashes) or Firestore-style IDs (20+ alphanum). */
function looksLikeId(s: string): boolean {
  if (!s) return false;
  if (s.includes('-') && s.length >= 32) return true;
  if (s.length >= 20 && /^[a-zA-Z0-9]+$/.test(s)) return true;
  return false;
}
