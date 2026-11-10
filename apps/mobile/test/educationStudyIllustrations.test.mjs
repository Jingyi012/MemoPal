import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudyIllustration } from '../../../shared/education/studyIllustrations.ts';
test('authored diagram parameters are interpreted without a course-specific catalog', () => {
 assert.deepEqual(parseStudyIllustration('fraction-3-7'), {kind:'fraction',shaded:3,parts:7});
 assert.deepEqual(parseStudyIllustration('media:learning-shape-polygon-5'), {kind:'shape',shape:'polygon',sides:5});
 assert.deepEqual(parseStudyIllustration('pattern-blue-square-red-red'), {kind:'pattern',symbols:['blue','square','red','red']});
 assert.deepEqual(parseStudyIllustration('fraction-half'), {kind:'fraction',shaded:1,parts:2});
});
test('invalid and private references never render public teaching diagrams', () => {
 for (const value of ['media:private-upload','https://private.test/photo','fraction-8-7','fraction-1-13','shape-polygon-2','pattern-red-private','pattern-red',null]) assert.equal(parseStudyIllustration(value),null);
});
