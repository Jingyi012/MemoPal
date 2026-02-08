import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// --- Helpers for common columns ---
const commonColumns = {
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  lastSyncedAt: text('last_synced_at'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
  deletedAt: text('deleted_at'),
};

// --- Tables ---
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  totalXp: integer('total_xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  ...commonColumns,
});

export const palaces = sqliteTable('palaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  locationsCount: integer('locations_count').default(0).notNull(),
  thumbnail: text('thumbnail').notNull(),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false).notNull(),
  requiredXp: integer('required_xp').default(0).notNull(),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false).notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false).notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }), // for custom palace
  ...commonColumns,
});

export const userPalaces = sqliteTable(
  'user_palaces',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    palaceId: text('palace_id')
      .references(() => palaces.id, { onDelete: 'cascade' })
      .notNull(),
    unlockedAt: text('unlocked_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique().on(table.userId, table.palaceId)]
);

export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  palaceId: text('palace_id')
    .references(() => palaces.id, { onDelete: 'cascade' })
    .notNull(),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  ...commonColumns,
});

export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  palaceId: text('palace_id')
    .references(() => palaces.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  wordCount: integer('word_count').default(0).notNull(),
  category: text('category').$type<
    | 'language-learning'
    | 'vocabulary'
    | 'medical'
    | 'science'
    | 'history'
    | 'business'
    | 'test-prep'
    | 'general'
  >(),
  privacy: text('privacy').$type<'private' | 'public'>().default('private'),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'cascade' }), // for custom lesson
  ...commonColumns,
});

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    lessonId: text('lesson_id')
      .references(() => lessons.id, { onDelete: 'cascade' })
      .notNull(),
    firstCompletedDate: text('first_completed_date'),
    totalReviews: integer('total_reviews').default(0).notNull(),
    masteryLevel: text('mastery_level')
      .$type<'new' | 'learning' | 'reviewing' | 'mastered'>()
      .default('new'),
    lastReviewDate: text('last_review_date'),
    xpEarned: integer('xp_earned').default(0).notNull(),
    ...commonColumns,
  },
  (table) => [unique().on(table.userId, table.lessonId)]
);

export const reviewSchedules = sqliteTable('review_schedules', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  lessonProgressId: text('lesson_progress_id')
    .references(() => lessonProgress.id, { onDelete: 'cascade' })
    .notNull(),
  reviewRound: integer('review_round').notNull(),
  dueDate: text('due_date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  completedDate: text('completed_date'),
  ...commonColumns,
});

export const words = sqliteTable('words', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id')
    .references(() => lessons.id, { onDelete: 'cascade' })
    .notNull(),
  locationId: text('location_id')
    .references(() => locations.id)
    .notNull(),
  text: text('text').notNull(),
  meaning: text('meaning'),
  ...commonColumns,
});

export const xpEvents = sqliteTable('xp_events', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  sourceType: text('source_type')
    .$type<
      'lesson_complete' | 'review_complete' | 'word_mastered' | 'streak_bonus' | 'manual_adjustment'
    >()
    .notNull(),
  sourceId: text('source_id'),
  xpAmount: integer('xp_amount').notNull(),
  clientEventId: text('client_event_id').notNull().unique(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const xpConfigs = sqliteTable('xp_configs', {
  id: text('id').primaryKey(),
  sourceType: text('source_type')
    .$type<
      | 'lesson_complete'
      | 'review_complete'
      | 'word_mastered'
      | 'streak_bonus'
      | 'manual_adjustment'
      | 'daily_login'
    >()
    .notNull(),

  baseXp: integer('base_xp').notNull(),
  variableXp: integer('variable_xp').default(0).notNull(),

  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  ...commonColumns,
});

export const levelConfigs = sqliteTable('level_configs', {
  level: integer('level').primaryKey(),
  requiredXp: integer('required_xp').notNull(),
  title: text('title'),
  ...commonColumns,
});

export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. first_lesson_completed
  title: text('title').notNull(),
  description: text('description'),
  conditionType: text('condition_type')
    .$type<'total_xp' | 'level' | 'lessons_completed' | 'words_learned' | 'streak_days'>()
    .notNull(),
  conditionValue: integer('condition_value').notNull(),
  ...commonColumns,
});

export const userMilestones = sqliteTable('user_milestones', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  milestoneId: text('milestone_id')
    .references(() => milestones.id)
    .notNull(),
  achievedAt: text('achieved_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  ...commonColumns,
});

export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  icon: text('icon_url'),
  rarity: text('rarity').$type<'common' | 'rare' | 'epic' | 'legendary'>(),
  ...commonColumns,
});

export const userBadges = sqliteTable('user_badges', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  badgeId: text('badge_id')
    .references(() => badges.id)
    .notNull(),
  earnedAt: text('earned_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  ...commonColumns,
});

export const userStats = sqliteTable('user_stats', {
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  lessonsCompleted: integer('lessons_completed').default(0).notNull(),
  wordsLearned: integer('words_learned').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: text('last_active_date'),
  ...commonColumns,
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  type: text('type')
    .$type<'xp' | 'level_up' | 'milestone' | 'badge' | 'lesson' | 'system'>()
    .notNull(),

  title: text('title').notNull(),
  body: text('body').notNull(),

  /** Deep-link target */
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),

  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),

  isDismissed: integer('is_dismissed', { mode: 'boolean' }).default(false).notNull(),

  readAt: text('read_at'),
  ...commonColumns,
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').$type<'create' | 'update' | 'delete'>().notNull(),
  payload: text('payload'),
  createdAt: text('created_at').notNull(),
});

// ============================
// Relations
// ============================

export const palacesRelations = relations(palaces, ({ one, many }) => ({
  locations: many(locations),
  lessons: many(lessons),
  userPalaces: many(userPalaces),
  creator: one(users, {
    fields: [palaces.createdBy],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  palace: one(palaces, { fields: [locations.palaceId], references: [palaces.id] }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  palace: one(palaces, { fields: [lessons.palaceId], references: [palaces.id] }),
  words: many(words),
  progress: many(lessonProgress),
  creator: one(users, {
    fields: [lessons.createdBy],
    references: [users.id],
  }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one, many }) => ({
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  reviewSchedules: many(reviewSchedules),
}));

export const reviewSchedulesRelations = relations(reviewSchedules, ({ one }) => ({
  progress: one(lessonProgress, {
    fields: [reviewSchedules.lessonProgressId],
    references: [lessonProgress.id],
  }),
  user: one(users, { fields: [reviewSchedules.userId], references: [users.id] }),
}));

export const wordsRelations = relations(words, ({ one }) => ({
  lesson: one(lessons, { fields: [words.lessonId], references: [lessons.id] }),
  location: one(locations, { fields: [words.locationId], references: [locations.id] }),
}));

export const xpEventsRelations = relations(xpEvents, ({ one }) => ({
  user: one(users, { fields: [xpEvents.userId], references: [users.id] }),
}));

export const userPalacesRelations = relations(userPalaces, ({ one }) => ({
  user: one(users, { fields: [userPalaces.userId], references: [users.id] }),
  palace: one(palaces, { fields: [userPalaces.palaceId], references: [palaces.id] }),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, { fields: [userMilestones.userId], references: [users.id] }),
  milestone: one(milestones, { fields: [userMilestones.milestoneId], references: [milestones.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, { fields: [userStats.userId], references: [users.id] }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
