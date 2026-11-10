import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === './educationStudyList' ? `${specifier}.ts` : specifier, context);
} });
const { newDraftUnit, addDraftWords, changeDraftWord, draftUnitsReady, draftUnitsPayload } = await import('../src/features/education/utils/educationDraftEditor.ts');

test('named units preserve pasted meanings, word order and chosen unit boundaries', () => {
  const a = newDraftUnit('Directions'); const b = newDraftUnit('Up and down');
  let units = addDraftWords([a, b], a.id, 'North\t北\nSouth\t南');
  units = addDraftWords(units, b.id, 'Up\t上');
  assert.equal(draftUnitsReady(units), true);
  assert.deepEqual(draftUnitsPayload(units, false), [
    { title: 'Directions', entries: [{ text: 'North', meaning: '北' }, { text: 'South', meaning: '南' }] },
    { title: 'Up and down', entries: [{ text: 'Up', meaning: '上' }] },
  ]);
  assert.equal(addDraftWords(units, b.id, 'north'), null);
  assert.equal(addDraftWords(units, b.id, 'x'.repeat(501)), null);
});

test('editing and moving a word preserves its identity and leaves the source untouched', () => {
  const a = newDraftUnit('A'); const b = newDraftUnit('B');
  const units = addDraftWords([a, b], a.id, 'South');
  const id = units[0].words[0].id;
  const moved = changeDraftWord(units, id, b.id, ' south ', '南');
  assert.equal(units[0].words.length, 1);
  assert.equal(moved[0].words.length, 0);
  assert.deepEqual(moved[1].words[0], { id, text: 'south', meaning: '南' });
  assert.equal(draftUnitsReady(moved), false);
  assert.equal(changeDraftWord(moved, id, a.id, '', ''), null);
  assert.equal(changeDraftWord(moved, id, 'missing', 'South', ''), null);
});

test('empty units block saving and default names follow the preview order', () => {
  const a = newDraftUnit(); const b = newDraftUnit(' Named ');
  let units = addDraftWords([a, b], a.id, 'one');
  units = addDraftWords(units, b.id, 'two');
  assert.equal(draftUnitsReady([newDraftUnit()]), false);
  assert.equal(draftUnitsPayload([units[1], units[0]], true)[1].title, '单元 2');
  assert.equal(draftUnitsPayload(units, false)[1].title, 'Named');
});

const { educationDraftSaveError } = await import('../src/features/education/utils/educationDraftSaveError.ts');
test('an outdated service explains the rejected named-unit save and retains the draft', () => {
  const failure = { response: { status: 400, data: { errors: { Entries: ['The Entries field is required.'] } } } };
  assert.match(educationDraftSaveError(failure, true), /尚未支持按单元保存/);
  assert.match(educationDraftSaveError(failure, true), /内容仍保留/);
  assert.match(educationDraftSaveError(failure, false), /needs an update/);
});
test('save errors distinguish connection failures and hide server internals', () => {
  assert.match(educationDraftSaveError({ code: 'ECONNABORTED' }, true), /超时/);
  assert.match(educationDraftSaveError({ code: 'ERR_NETWORK' }, true), /无法连接/);
  const failure = { response: { status: 500, data: { message: 'private database stack trace' } } };
  assert.equal(educationDraftSaveError(failure, false).includes('stack trace'), false);
  assert.match(educationDraftSaveError({ response: { status: 400 } }, true), /空单元/);
});
