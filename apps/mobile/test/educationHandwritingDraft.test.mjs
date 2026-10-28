import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HANDWRITING_MAX_POINTS_PER_STROKE,
  HANDWRITING_MAX_STROKES,
  appendHandwritingPoint,
  canEditHandwritingDraft,
  completeHandwritingDraft,
  createHandwritingDraft,
  discardHandwritingDraft,
  expireHandwritingDraft,
  handwritingHasUnsavedWork,
  markHandwritingFilePending,
  resetHandwritingDraftForIdentity,
} from '../src/features/education/utils/educationHandwritingDraft.ts';

test('single tap becomes a visible dot and discard clears an unsaved draft', () => {
  let draft = createHandwritingDraft('learner:attempt:question');
  draft = { ...draft, strokes: appendHandwritingPoint(draft.strokes, { x: 12, y: 18 }, true) };
  assert.deepEqual(draft.strokes, [[{ x: 12, y: 18 }]]);
  assert.equal(handwritingHasUnsavedWork(draft, false, false), true);
  assert.deepEqual(discardHandwritingDraft(draft).strokes, []);
});

test('stroke and point limits reject overflow without joining another gesture', () => {
  let strokes = [];
  for (let index = 0; index < HANDWRITING_MAX_STROKES; index += 1) {
    strokes = appendHandwritingPoint(strokes, { x: index, y: index }, true);
  }
  assert.equal(appendHandwritingPoint(strokes, { x: 1, y: 1 }, true), strokes);
  let longStrokes = [[{ x: 0, y: 0 }]];
  for (let index = 1; index < HANDWRITING_MAX_POINTS_PER_STROKE; index += 1) {
    longStrokes = appendHandwritingPoint(longStrokes, { x: index, y: index });
  }
  assert.equal(appendHandwritingPoint(longStrokes, { x: 501, y: 501 }), longStrokes);
});

test('a pending PNG draft stays locked from edits until the upload completes or it is discarded', () => {
  const pending = markHandwritingFilePending({ ...createHandwritingDraft('u:a:q'), strokes: [[{ x: 4, y: 8 }]] });
  assert.equal(canEditHandwritingDraft(pending, false, false), false);
  assert.equal(handwritingHasUnsavedWork(pending, false, false), true);
  const saved = completeHandwritingDraft(pending);
  assert.equal(canEditHandwritingDraft(saved, false, false), true);
  assert.equal(handwritingHasUnsavedWork(saved, false, false), false);
});

test('expiry discards dirty drawing and identity change cannot carry it to another learner or question', () => {
  const dirty = { ...createHandwritingDraft('u1:a:q1'), strokes: [[{ x: 1, y: 1 }]], pendingFile: true };
  const expired = expireHandwritingDraft(dirty);
  assert.equal(expired.strokes.length, 0);
  assert.equal(expired.pendingFile, false);
  assert.equal(canEditHandwritingDraft(expired, false, false), false);
  const changed = resetHandwritingDraftForIdentity(dirty, 'u2:a:q1');
  assert.equal(changed.identity, 'u2:a:q1');
  assert.equal(changed.strokes.length, 0);
  assert.equal(changed.pendingFile, false);
});
