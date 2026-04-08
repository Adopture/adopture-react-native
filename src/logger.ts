let debugEnabled = false;

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

export function log(message: string): void {
  if (debugEnabled) {
    console.debug(`[Adopture] ${message}`);
  }
}
