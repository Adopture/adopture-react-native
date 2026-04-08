import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { Hashing } from '../src/hashing';

/** Reference SHA256 using Node's built-in crypto. */
function referenceSha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

describe('Hashing', () => {
  describe('SHA256 correctness', () => {
    // NIST / well-known test vectors
    const vectors: [string, string][] = [
      ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
      ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
      [
        'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
        '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
      ],
      // Multi-byte UTF-8
      ['Grüße', referenceSha256('Grüße')],
      ['日本語テスト', referenceSha256('日本語テスト')],
      // Emoji (surrogate pair)
      ['Hello 🌍', referenceSha256('Hello 🌍')],
      // Long input
      ['a'.repeat(1000), referenceSha256('a'.repeat(1000))],
    ];

    it.each(vectors)('sha256(%j) matches expected', (input, expected) => {
      const hashing = new Hashing('device-id', 'ak_test');
      // hashUserId uses SHA256(userId + appKey) so we can verify by comparing
      // against reference: sha256(input + 'ak_test')
      // But for pure SHA256 verification, we use a trick: create a Hashing
      // instance where deviceId=input, appKey='', and check dailyHash
      // against reference with the known salt format.
      //
      // Instead, let's verify through hashUserId which does sha256(userId + appKey)
      // For pure sha256 test, we set appKey to '' and check hashUserId
      const h = new Hashing('', '');
      const result = h.hashUserId(input);
      // hashUserId does sha256(userId + appKey) = sha256(input + '') = sha256(input)
      expect(result).toBe(expected);
    });
  });

  describe('dailyHash', () => {
    it('returns deterministic hash for same device + app + day', () => {
      const h1 = new Hashing('device-123', 'ak_testapp1234567890abc');
      const h2 = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h1.dailyHash()).toBe(h2.dailyHash());
    });

    it('returns different hash for different device IDs', () => {
      const h1 = new Hashing('device-a', 'ak_testapp1234567890abc');
      const h2 = new Hashing('device-b', 'ak_testapp1234567890abc');
      expect(h1.dailyHash()).not.toBe(h2.dailyHash());
    });

    it('returns different hash for different app keys', () => {
      const h1 = new Hashing('device-123', 'ak_app1111111111111111111');
      const h2 = new Hashing('device-123', 'ak_app2222222222222222222');
      expect(h1.dailyHash()).not.toBe(h2.dailyHash());
    });

    it('caches result on repeated calls', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      const first = h.dailyHash();
      const second = h.dailyHash();
      expect(first).toBe(second);
    });

    it('produces a 64-char hex string', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h.dailyHash()).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('monthlyHash', () => {
    it('returns deterministic hash', () => {
      const h1 = new Hashing('device-123', 'ak_testapp1234567890abc');
      const h2 = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h1.monthlyHash()).toBe(h2.monthlyHash());
    });

    it('differs from dailyHash', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h.monthlyHash()).not.toBe(h.dailyHash());
    });
  });

  describe('retentionHash', () => {
    it('returns deterministic hash', () => {
      const h1 = new Hashing('device-123', 'ak_testapp1234567890abc');
      const h2 = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h1.retentionHash()).toBe(h2.retentionHash());
    });

    it('differs from dailyHash and monthlyHash', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h.retentionHash()).not.toBe(h.dailyHash());
      expect(h.retentionHash()).not.toBe(h.monthlyHash());
    });
  });

  describe('hashUserId', () => {
    it('matches Node crypto reference', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      const result = h.hashUserId('user-42');
      const expected = referenceSha256('user-42ak_testapp1234567890abc');
      expect(result).toBe(expected);
    });

    it('is stable across calls', () => {
      const h = new Hashing('device-123', 'ak_testapp1234567890abc');
      expect(h.hashUserId('user-1')).toBe(h.hashUserId('user-1'));
    });
  });
});
