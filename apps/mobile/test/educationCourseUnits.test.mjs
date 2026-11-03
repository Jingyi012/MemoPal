import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCourseObjectives } from '../src/features/education/utils/educationCourseUnits.ts';

test('unit and objective ordering follow author outline and preserve ungrouped material', () => {
  const result = groupCourseObjectives({ objectives: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], units: [
    { id: 'second', title: 'Second', position: 2, objectiveIds: ['b', 'a'] },
    { id: 'first', title: 'First', position: 1, objectiveIds: [] },
  ] });
  assert.deepEqual(result.map(g => g.id), ['first', 'second', 'ungrouped']);
  assert.deepEqual(result[1].objectives.map(o => o.id), ['b', 'a']);
  assert.deepEqual(result[2].objectives.map(o => o.id), ['c']);
});
test('legacy courses and empty courses retain a visible path', () => {
  assert.deepEqual(groupCourseObjectives({ objectives: [{ id: 'a' }] })[0].objectives, [{ id: 'a' }]);
  assert.equal(groupCourseObjectives({ objectives: [] }).length, 1);
});
test('stale references do not lose or duplicate real learning content', () => {
  const groups = groupCourseObjectives({ objectives: [{ id: 'a' }, { id: 'b' }], units: [
    { id: 'u', title: 'Unit', position: 1, objectiveIds: ['missing', 'a', 'a'] },
  ] });
  assert.deepEqual(groups.flatMap(group => group.objectives.map(item => item.id)), ['a', 'b']);
});
