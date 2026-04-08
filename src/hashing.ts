import { pad2 } from './utils';

/**
 * Pure-JS SHA256 implementation.
 * Produces hex-encoded output identical to Dart's `sha256.convert(utf8.encode(input))`.
 */
function sha256(input: string): string {
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // UTF-8 encode
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let c = input.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c < 0xdc00) {
      // Surrogate pair
      const next = input.charCodeAt(++i);
      c = 0x10000 + ((c - 0xd800) << 10) + (next - 0xdc00);
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f),
      );
    } else {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }

  // Pre-processing: adding padding bits
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // Append length as 64-bit big-endian
  bytes.push(0, 0, 0, 0); // High 32 bits (we only support < 2^32 bit messages)
  bytes.push(
    (bitLen >>> 24) & 0xff,
    (bitLen >>> 16) & 0xff,
    (bitLen >>> 8) & 0xff,
    bitLen & 0xff,
  );

  // Initialize hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);

  // Process each 512-bit (64-byte) chunk
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const j = offset + i * 4;
      w[i] =
        ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        (((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^
          ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^
          (w[i - 15] >>> 3)) >>>
        0;
      const s1 =
        (((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^
          ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^
          (w[i - 2] >>> 10)) >>>
        0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 =
        (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 =
        (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  function hex(n: number): string {
    return n.toString(16).padStart(8, '0');
  }

  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

/**
 * Generates privacy-preserving hashed identifiers.
 * Produces daily, monthly, and retention hashes using SHA256
 * with rotating date-based salts. The raw device ID never leaves the device.
 */
export class Hashing {
  private readonly deviceId: string;
  private readonly appKey: string;

  private cachedDailyHash: string | null = null;
  private cachedMonthlyHash: string | null = null;
  private cachedRetentionHash: string | null = null;
  private lastDailySalt: string | null = null;
  private lastMonthlySalt: string | null = null;
  private lastRetentionSalt: string | null = null;

  constructor(deviceId: string, appKey: string) {
    this.deviceId = deviceId;
    this.appKey = appKey;
  }

  /** SHA256(device_id + app_key + YYYY-MM-DD) for DAU counting. */
  dailyHash(): string {
    const salt = this.dailySalt();
    if (salt === this.lastDailySalt && this.cachedDailyHash != null) {
      return this.cachedDailyHash;
    }
    this.lastDailySalt = salt;
    this.cachedDailyHash = this.hash(salt);
    return this.cachedDailyHash;
  }

  /** SHA256(device_id + app_key + YYYY-MM) for MAU + retention. */
  monthlyHash(): string {
    const salt = this.monthlySalt();
    if (salt === this.lastMonthlySalt && this.cachedMonthlyHash != null) {
      return this.cachedMonthlyHash;
    }
    this.lastMonthlySalt = salt;
    this.cachedMonthlyHash = this.hash(salt);
    return this.cachedMonthlyHash;
  }

  /** SHA256(device_id + app_key + YYYY-QN) for 90-day retention buckets. */
  retentionHash(): string {
    const salt = this.retentionSalt();
    if (salt === this.lastRetentionSalt && this.cachedRetentionHash != null) {
      return this.cachedRetentionHash;
    }
    this.lastRetentionSalt = salt;
    this.cachedRetentionHash = this.hash(salt);
    return this.cachedRetentionHash;
  }

  /** SHA256(userId + appKey) — stable hash, no date rotation. */
  hashUserId(userId: string): string {
    return sha256(`${userId}${this.appKey}`);
  }

  private hash(salt: string): string {
    return sha256(`${this.deviceId}${this.appKey}${salt}`);
  }

  private dailySalt(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`;
  }

  private monthlySalt(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;
  }

  private retentionSalt(): string {
    const now = new Date();
    const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
    return `${now.getUTCFullYear()}-Q${quarter}`;
  }
}
