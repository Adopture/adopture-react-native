// Polyfill crypto.getRandomValues for Hermes — must be imported before uuid
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/** Generates a UUID v4 string. */
export function generateUUID(): string {
  return uuidv4();
}

/** Returns the current UTC time as ISO 8601 string without milliseconds (matching Flutter SDK format). */
export function utcTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('.')[0] + 'Z';
}

/** Pads a number to 2 digits. */
export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
