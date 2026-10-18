import assert from 'node:assert/strict';
import test from 'node:test';
import { enqueueEducationAttemptWrite } from '../src/features/education/utils/educationAttemptWriteQueue.ts';

test('serializes answer saves and attachment uploads through one attempt queue', async () => {
  const queue = { current: Promise.resolve() };
  const events = [];
  let releaseFirst;
  const first = enqueueEducationAttemptWrite(queue, async () => {
    events.push('answer-save-start');
    await new Promise(resolve => { releaseFirst = resolve; });
    events.push('answer-save-finish');
    return 1;
  });
  const second = enqueueEducationAttemptWrite(queue, async () => {
    events.push('attachment-upload');
    return 2;
  });

  await Promise.resolve();
  assert.deepEqual(events, ['answer-save-start']);
  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(events, ['answer-save-start', 'answer-save-finish', 'attachment-upload']);
});

test('a failed write does not block later writes', async () => {
  const queue = { current: Promise.resolve() };
  const failed = enqueueEducationAttemptWrite(queue, async () => { throw new Error('upload failed'); });
  const next = enqueueEducationAttemptWrite(queue, async () => 'saved');

  await assert.rejects(failed, /upload failed/);
  assert.equal(await next, 'saved');
});
