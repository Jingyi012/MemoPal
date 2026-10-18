import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeReferralCode } from '../src/features/auth/utils/safeReferralCode.ts';

test('accepts server-generated referral codes and normalizes case', () => {
  assert.equal(getSafeReferralCode(' abcd2345 '), 'ABCD2345');
  assert.equal(getSafeReferralCode('ABCDEFGHJK'), 'ABCDEFGHJK');
});

test('rejects malformed or non-string referral parameters', () => {
  for (const value of ['short', 'TOO-LONG-CODE', 'ABCDEFG/next', 'ABCDEFGH?redirect=x', ['ABCDEFGH'], null]) {
    assert.equal(getSafeReferralCode(value), '');
  }
});
