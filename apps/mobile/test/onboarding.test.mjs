import assert from 'node:assert/strict';
import test from 'node:test';
import { spotlightCardPlacement, tourStorageKey } from '../src/features/onboarding/utils/spotlight.ts';
import { getStarterLessons, localizeStarterLesson, starterMemoryParams } from '../src/features/onboarding/utils/starterMemory.ts';
import { guidedStarterSessionHref, practiceCreateHref } from '../src/features/onboarding/utils/onboardingRoutes.ts';
import { predefinedLessonRoute } from '../src/features/predefined-memory-lessons/utils/predefinedLessonRoute.ts';

test('predefined entry preserves lesson identity and authored Palace scene through navigation', () => {
  const lesson = { id: 'authored-lesson', titleEn: 'Planets', titleZh: '行星', emoji: '🪐',
    goalType: 'ordered-list', techniqueKey: 'palace', palaceSceneId: 'home-office',
    items: [{ position: 2, contentEn: 'Venus', contentZh: '金星' },
      { position: 1, contentEn: 'Mercury', contentZh: '水星' }] };
  const palace = predefinedLessonRoute(lesson, 'zh');
  assert.equal(palace.pathname, '/palaces/create-memory');
  assert.equal(palace.params.predefinedLessonId, lesson.id);
  assert.equal(palace.params.sceneId, 'home-office');
  assert.deepEqual(JSON.parse(palace.params.items), ['水星', '金星']);
  const peg = predefinedLessonRoute({ ...lesson, techniqueKey: 'number-peg' }, 'en');
  assert.equal(peg.pathname, '/number-peg/create');
  assert.equal(peg.params.predefinedLessonId, lesson.id);
  assert.equal(peg.params.sceneId, undefined);
});

test('page completion is isolated by account and page', () => {
  assert.notEqual(tourStorageKey('alice', 'practicePage'), tourStorageKey('bob', 'practicePage'));
  assert.notEqual(tourStorageKey('alice', 'practicePage'), tourStorageKey('alice', 'libraryPage'));
  assert.equal(tourStorageKey('alice', 'practicePage'), tourStorageKey('alice', 'practicePage'));
});

test('tooltip sits below a top target and above a bottom target', () => {
  const top = { x: 20, y: 90, width: 340, height: 60 };
  const bottom = { x: 20, y: 650, width: 340, height: 48 };
  const topPlacement = spotlightCardPlacement(top, 800, 44);
  assert.ok(topPlacement.top > top.y + top.height);
  const bottomPlacement = spotlightCardPlacement(bottom, 800, 44);
  assert.ok(800 - bottomPlacement.bottom < bottom.y);
  assert.ok(topPlacement.top >= 56);
  assert.ok(bottomPlacement.top >= 56);
});

test('small screens and unavailable target keep the close area and safe area usable', () => {
  for (const height of [360, 640, 844]) {
    const placement = spotlightCardPlacement(null, height, 24);
    assert.ok(placement.top >= 36);
    assert.ok(placement.top + placement.bottom < height);
  }
});

const lesson = {
  id: 'configured-lesson', titleEn: 'Planets', titleZh: '行星',
  descriptionEn: 'Learn planets', descriptionZh: '认识行星', goalType: 'facts',
  categoryId: 'science', category: { isActive: true, sortOrder: 1 },
  isPublished: true, isStarterLesson: true, techniqueKey: 'number-peg', sortOrder: 2,
  items: [
    { position: 2, contentEn: 'Venus', contentZh: '金星' },
    { position: 1, contentEn: 'Mercury', contentZh: '水星' },
  ],
};

test('guided memory uses the selected backend lesson and ordered localized content', () => {
  const en = starterMemoryParams(lesson, 'en');
  const zh = starterMemoryParams(lesson, 'zh');
  assert.deepEqual(JSON.parse(en.items), ['Mercury', 'Venus']);
  assert.deepEqual(JSON.parse(zh.items), ['水星', '金星']);
  assert.equal(en.title, lesson.titleEn);
  assert.equal(zh.title, lesson.titleZh);
  assert.equal(en.goalType, 'facts');
  assert.equal(en.onboardingLessonId, lesson.id);
  assert.equal(en.guidedStarter, '1');
  assert.equal(localizeStarterLesson(lesson, 'zh').description, lesson.descriptionZh);
  assert.equal(lesson.items[0].position, 2);
});

test('only published active supported starter lessons appear in configured order', () => {
  const first = { ...lesson, id: 'first', sortOrder: 1 };
  const disabled = [
    { ...lesson, isPublished: false }, { ...lesson, isStarterLesson: false },
    { ...lesson, category: { isActive: false, sortOrder: 0 } },
    { ...lesson, techniqueKey: 'palace' }, { ...lesson, items: [] },
    { ...lesson, items: Array(6).fill(lesson.items[0]) },
  ];
  assert.deepEqual(getStarterLessons([lesson, ...disabled, first]).map(item => item.id), ['first', lesson.id]);
  assert.deepEqual(getStarterLessons(disabled), []);
});

test('a saved or resumed starter continues directly into guided practice', () => {
  const href = guidedStarterSessionHref('memory/id');
  assert.equal(href, '/number-peg/memory%2Fid?guided=1&returnTo=practice');
  assert.equal(href.includes('library'), false);
});

test('the Practice guide only resumes a memory while onboarding is in progress', () => {
  assert.equal(practiceCreateHref('in-progress', 'starter-id', true), '/onboarding?replay=true');
  assert.equal(practiceCreateHref('in-progress', 'starter-id', false), guidedStarterSessionHref('starter-id'));
  assert.equal(practiceCreateHref('completed', 'old-starter-id', true), '/onboarding?replay=true');
  assert.equal(practiceCreateHref('skipped', 'old-starter-id', true), '/onboarding?replay=true');
  assert.equal(practiceCreateHref('completed', 'old-starter-id', false), '/create-memory');
});
