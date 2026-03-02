import { MOCK_USER } from '@/constants/auth';
import { db } from '@/db/client';
import * as schema from '@/db/schema';
import { SourceType } from '@/enums/sourceType';

type PalaceSeed = {
  id: string;
  name: string;
  description: string;
  theme: string;
  requiredXp: number;
  isLocked: boolean;
  thumbnail: string;
};

const PALACES: PalaceSeed[] = [
  {
    id: 'home-haven',
    name: 'Home Haven Palace',
    description: 'A familiar home journey to build your first memory foundation.',
    theme: 'home',
    requiredXp: 0,
    isLocked: false,
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  },
  {
    id: 'market-route',
    name: 'Market Route Palace',
    description: 'A lively market route with practical daily vocabulary.',
    theme: 'market',
    requiredXp: 250,
    isLocked: false,
    thumbnail: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  },
  {
    id: 'campus-trail',
    name: 'Campus Trail Palace',
    description: 'An academic journey focused on learning and productivity words.',
    theme: 'campus',
    requiredXp: 600,
    isLocked: true,
    thumbnail: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800',
  },
];

const LOCATION_NAMES_BY_THEME: Record<string, string[]> = {
  home: [
    'Front Gate',
    'Shoe Rack',
    'Living Room Sofa',
    'TV Console',
    'Dining Table',
    'Kitchen Sink',
    'Fridge Door',
    'Bedroom Desk',
    'Wardrobe',
    'Bathroom Mirror',
  ],
  market: [
    'Parking Lot',
    'Main Entrance',
    'Fruit Stall',
    'Vegetable Stall',
    'Bakery Counter',
    'Meat Section',
    'Dairy Chiller',
    'Cashier Lane',
    'Receipt Counter',
    'Exit Door',
  ],
  campus: [
    'Main Gate',
    'Notice Board',
    'Library Door',
    'Reading Table',
    'Computer Lab',
    'Lecture Hall',
    'Cafeteria Queue',
    'Study Bench',
    'Sports Court',
    'Dorm Entrance',
  ],
};

const LESSON_TOPICS_BY_THEME: Record<string, string[]> = {
  home: [
    'Home Essentials',
    'Daily Actions',
    'Kitchen Basics',
    'Family & Relationships',
    'Common Adjectives',
    'Household Objects',
    'Morning Routine',
    'Evening Routine',
    'Health Habits',
    'Weekend Chores',
  ],
  market: [
    'Fresh Produce',
    'Payment Vocabulary',
    'Shopping Actions',
    'Food Packaging',
    'Numbers & Quantity',
    'Customer Questions',
    'Directions in Store',
    'Bargaining Terms',
    'Popular Snacks',
    'Checkout Phrases',
  ],
  campus: [
    'Classroom Language',
    'Study Verbs',
    'Academic Nouns',
    'Exam Vocabulary',
    'Presentation Phrases',
    'Teamwork Terms',
    'Library Terms',
    'Research Words',
    'Career Prep',
    'Project Planning',
  ],
};

const WORD_BANK_BY_THEME: Record<string, Array<{ text: string; meaning: string }>> = {
  home: [
    { text: 'Lamp', meaning: 'A light source for a room' },
    { text: 'Curtain', meaning: 'Fabric covering a window' },
    { text: 'Broom', meaning: 'Tool for sweeping dust' },
    { text: 'Fold', meaning: 'To bend something over itself' },
    { text: 'Boil', meaning: 'To heat liquid until bubbling' },
    { text: 'Plate', meaning: 'Flat dish for food' },
    { text: 'Comfort', meaning: 'A state of physical ease' },
    { text: 'Organize', meaning: 'Arrange things neatly' },
    { text: 'Tidy', meaning: 'Clean and ordered' },
    { text: 'Relax', meaning: 'Become less tense' },
    { text: 'Laundry', meaning: 'Clothes to be washed' },
    { text: 'Pillow', meaning: 'Soft support for the head' },
    { text: 'Mop', meaning: 'Tool for cleaning floors' },
    { text: 'Spoon', meaning: 'Utensil for eating or stirring' },
    { text: 'Shelter', meaning: 'A place providing protection' },
  ],
  market: [
    { text: 'Basket', meaning: 'Container used for shopping' },
    { text: 'Receipt', meaning: 'Proof of payment' },
    { text: 'Discount', meaning: 'Reduction in price' },
    { text: 'Fresh', meaning: 'Recently produced; not stale' },
    { text: 'Weigh', meaning: 'Measure heaviness' },
    { text: 'Aisle', meaning: 'Passage between shelves' },
    { text: 'Cashier', meaning: 'Person handling payments' },
    { text: 'Queue', meaning: 'A line of waiting people' },
    { text: 'Coupon', meaning: 'Voucher for discount' },
    { text: 'Budget', meaning: 'Planned amount of money' },
    { text: 'Barcode', meaning: 'Machine-readable code on products' },
    { text: 'Refill', meaning: 'Fill again' },
    { text: 'Cart', meaning: 'Wheeled basket for shopping' },
    { text: 'Purchase', meaning: 'To buy something' },
    { text: 'Total', meaning: 'Final sum amount' },
  ],
  campus: [
    { text: 'Lecture', meaning: 'An educational talk' },
    { text: 'Assignment', meaning: 'Task given to students' },
    { text: 'Deadline', meaning: 'Latest time for completion' },
    { text: 'Revise', meaning: 'Review to improve knowledge' },
    { text: 'Analyze', meaning: 'Examine in detail' },
    { text: 'Reference', meaning: 'Source of information' },
    { text: 'Library', meaning: 'Place containing books and resources' },
    { text: 'Project', meaning: 'Planned work with specific goal' },
    { text: 'Schedule', meaning: 'Planned timetable' },
    { text: 'Collaborate', meaning: 'Work jointly with others' },
    { text: 'Present', meaning: 'Show or explain to audience' },
    { text: 'Summary', meaning: 'Short statement of main points' },
    { text: 'Research', meaning: 'Systematic investigation' },
    { text: 'Focus', meaning: 'Concentrated attention' },
    { text: 'Graduate', meaning: 'Complete a degree program' },
  ],
};

function buildPalaceLocations(palace: PalaceSeed) {
  return LOCATION_NAMES_BY_THEME[palace.theme].map((name, index) => ({
    id: `${palace.id}-loc-${index + 1}`,
    palaceId: palace.id,
    position: index + 1,
    name,
    description: `${name} is stop #${index + 1} in ${palace.name}.`,
    imageUrl: `https://picsum.photos/seed/${palace.id}-loc-${index + 1}/900/600`,
  }));
}

function buildPalaceLessons(palace: PalaceSeed) {
  const topics = LESSON_TOPICS_BY_THEME[palace.theme];
  const bank = WORD_BANK_BY_THEME[palace.theme];

  return topics.map((topic, index) => {
    const locationId = `${palace.id}-loc-${index + 1}`;
    const lessonId = `${palace.id}-lesson-${index + 1}`;

    const words = Array.from({ length: 3 }).map((_, wordOffset) => {
      const bankItem = bank[(index * 3 + wordOffset) % bank.length];
      return {
        id: `${lessonId}-word-${wordOffset + 1}`,
        lessonId,
        locationId,
        text: bankItem.text,
        meaning: bankItem.meaning,
      };
    });

    return {
      lesson: {
        id: lessonId,
        palaceId: palace.id,
        title: `${topic} (${index + 1}/10)`,
        description: `Lesson anchored to location #${index + 1} of ${palace.name}.`,
        wordCount: words.length,
        category: 'vocabulary' as const,
        privacy: 'private' as const,
        isCustom: false,
        isLocked: palace.isLocked,
        isPremium: false,
        createdBy: null,
      },
      words,
    };
  });
}

export async function seedInitialData() {
  const existingConfig = await db.query.levelConfigs.findFirst();
  if (existingConfig) return;

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();

    const levels = [
      { level: 1, requiredXp: 0, title: 'Novice', createdAt: now, updatedAt: now },
      { level: 2, requiredXp: 120, title: 'Apprentice', createdAt: now, updatedAt: now },
      { level: 3, requiredXp: 320, title: 'Scholar', createdAt: now, updatedAt: now },
      { level: 4, requiredXp: 640, title: 'Navigator', createdAt: now, updatedAt: now },
      { level: 5, requiredXp: 1000, title: 'Memory Keeper', createdAt: now, updatedAt: now },
      { level: 6, requiredXp: 1500, title: 'Palace Master', createdAt: now, updatedAt: now },
    ];

    const xpSettings = [
      { id: 'xp-lesson-complete', sourceType: SourceType.LessonComplete, baseXp: 35, variableXp: 10, isActive: true, createdAt: now, updatedAt: now },
      { id: 'xp-lesson-initial', sourceType: SourceType.LessonInitialCompletion, baseXp: 20, variableXp: 5, isActive: true, createdAt: now, updatedAt: now },
      { id: 'xp-review-complete', sourceType: SourceType.ReviewComplete, baseXp: 15, variableXp: 5, isActive: true, createdAt: now, updatedAt: now },
      { id: 'xp-streak', sourceType: SourceType.StreakBonus, baseXp: 10, variableXp: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'xp-manual-bonus', sourceType: SourceType.ManualAdjustment, baseXp: 120, variableXp: 0, isActive: true, createdAt: now, updatedAt: now },
    ];

    for (const lvl of levels) await tx.insert(schema.levelConfigs).values(lvl).onConflictDoNothing();
    for (const xp of xpSettings) await tx.insert(schema.xpConfigs).values(xp).onConflictDoNothing();

    await tx
      .insert(schema.users)
      .values({
        id: MOCK_USER.id,
        displayName: MOCK_USER.displayName,
        avatarUrl: MOCK_USER.avatarUrl ?? null,
        email: MOCK_USER.email ?? 'player@example.com',
        totalXp: 0,
        level: 1,
        isPremium: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.userStats)
      .values({
        userId: MOCK_USER.id,
        lessonsCompleted: 0,
        wordsLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    for (const palace of PALACES) {
      await tx
        .insert(schema.palaces)
        .values({
          id: palace.id,
          name: palace.name,
          description: palace.description,
          locationsCount: 10,
          thumbnail: palace.thumbnail,
          isLocked: palace.isLocked,
          unlockedAt: palace.isLocked ? null : now,
          requiredXp: palace.requiredXp,
          isPremium: false,
          isCustom: false,
          createdBy: null,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        })
        .onConflictDoNothing();

      const locations = buildPalaceLocations(palace);
      for (const location of locations) {
        await tx.insert(schema.locations).values({ ...location, createdAt: now, updatedAt: now }).onConflictDoNothing();
      }

      const lessonBundles = buildPalaceLessons(palace);
      for (const bundle of lessonBundles) {
        await tx.insert(schema.lessons).values({ ...bundle.lesson, createdAt: now, updatedAt: now }).onConflictDoNothing();
        for (const word of bundle.words) {
          await tx.insert(schema.words).values({ ...word, createdAt: now, updatedAt: now }).onConflictDoNothing();
        }
      }
    }

    const badgeDefinitions = [
      { id: 'badge-first-lesson', key: 'first_lesson', name: 'First Spark', description: 'Complete your first lesson', iconUrl: null, icon: 'sparkles', rarity: 'common' as const, earnedAt: now, createdAt: now, updatedAt: now },
      { id: 'badge-palace-complete', key: 'palace_complete', name: 'Palace Conqueror', description: 'Complete all 10 lessons in a palace', iconUrl: null, icon: 'castle', rarity: 'rare' as const, earnedAt: now, createdAt: now, updatedAt: now },
      { id: 'badge-review-10', key: 'review_10', name: 'Recall Runner', description: 'Complete 10 reviews', iconUrl: null, icon: 'brain', rarity: 'epic' as const, earnedAt: now, createdAt: now, updatedAt: now },
    ];

    for (const badge of badgeDefinitions) {
      await tx.insert(schema.badges).values(badge).onConflictDoNothing();
    }

    const milestoneDefinitions = [
      { id: 'ms-first-lesson', key: 'first_lesson_completed', title: 'First Step', description: 'Complete your first lesson', conditionType: 'lessons_completed' as const, conditionValue: 1, achievedAt: now, createdAt: now, updatedAt: now },
      { id: 'ms-first-palace', key: 'first_palace_completed', title: 'Palace Finisher', description: 'Complete all lessons in one palace', conditionType: 'lessons_completed' as const, conditionValue: 10, achievedAt: now, createdAt: now, updatedAt: now },
      { id: 'ms-50-words', key: 'fifty_words', title: 'Word Collector', description: 'Learn 50 words', conditionType: 'words_learned' as const, conditionValue: 50, achievedAt: now, createdAt: now, updatedAt: now },
      { id: 'ms-level-5', key: 'reach_level_5', title: 'Mind Ascender', description: 'Reach level 5', conditionType: 'level' as const, conditionValue: 5, achievedAt: now, createdAt: now, updatedAt: now },
    ];

    for (const milestone of milestoneDefinitions) {
      await tx.insert(schema.milestones).values(milestone).onConflictDoNothing();
    }
  });
}
