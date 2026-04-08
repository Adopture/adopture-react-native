import { generateUUID } from './utils';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Manages session lifecycle with 30-minute inactivity timeout. */
export class SessionManager {
  private _sessionId: string;
  private _lastActivityAt: number;

  constructor() {
    this._sessionId = generateUUID();
    this._lastActivityAt = Date.now();
  }

  get sessionId(): string {
    return this._sessionId;
  }

  /** Updates the last activity timestamp. */
  touch(): void {
    this._lastActivityAt = Date.now();
  }

  /** Checks if the session has expired and rotates if needed. Returns true if a new session was started. */
  rotateIfNeeded(): boolean {
    const elapsed = Date.now() - this._lastActivityAt;
    if (elapsed >= SESSION_TIMEOUT_MS) {
      this._sessionId = generateUUID();
      this._lastActivityAt = Date.now();
      return true;
    }
    return false;
  }

  /** Forces a new session (e.g., on reset). */
  startNewSession(): void {
    this._sessionId = generateUUID();
    this._lastActivityAt = Date.now();
  }
}
