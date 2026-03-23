/**
 * Central export point for all API modules
 * Organized by entity for clean separation of concerns
 *
 * Rules:
 * - Never call API directly from repositories or other layers
 * - Services call API through these modules
 * - Each module has entity-specific API calls
 */
export * from './badge';
export * from './lesson';
export * from './lessonProgress';
export * from './levelConfig';
export * from './location';
export * from './mission';
export * from './milestone';
export * from './palace';
export * from './review';
export * from './userStats';
export * from './word';
export * from './xpEvent';
export * from './xpConfig';
