import test from 'node:test';
import assert from 'node:assert/strict';
import { getEducationAuthoringPortalUrl } from '../src/features/education/utils/educationAuthoringPortal.ts';

test('builds the public educator workspace route from a configured portal origin', () => {
  assert.equal(
    getEducationAuthoringPortalUrl('https://learn.example.test/base/path'),
    'https://learn.example.test/education/courses',
  );
});

test('does not expose a portal entry when configuration is missing or unsafe', () => {
  assert.equal(getEducationAuthoringPortalUrl(''), null);
  assert.equal(getEducationAuthoringPortalUrl('javascript:alert(1)'), null);
  assert.equal(getEducationAuthoringPortalUrl('http://insecure.example.test'), null);
  assert.equal(getEducationAuthoringPortalUrl('https://user:password@example.test'), null);
});
