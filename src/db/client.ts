import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('memopal.db');

type TableInfoRow = { name: string };
type SqliteMasterRow = { name: string };

const tableExists = (tableName: string) => {
  const rows = expoDb.getAllSync<SqliteMasterRow>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [tableName]
  );
  return rows.length > 0;
};

const getTableColumns = (tableName: string) => {
  if (!tableExists(tableName)) return [];
  return expoDb.getAllSync<TableInfoRow>(`PRAGMA table_info('${tableName}')`);
};

const ensurePalaceLevelColumn = () => {
  try {
    const palaceColumns = getTableColumns('palaces');
    if (palaceColumns.length === 0) return;

    const hasLevel = palaceColumns.some((column) => column.name === 'level');
    if (!hasLevel) {
      expoDb.execSync('ALTER TABLE `palaces` ADD COLUMN `level` integer NOT NULL DEFAULT 1;');
    }

    const hasRequiredXp = palaceColumns.some((column) => column.name === 'required_xp');
    if (!hasRequiredXp) return;

    if (tableExists('level_configs')) {
      expoDb.execSync(`
        UPDATE \`palaces\`
        SET \`level\` = COALESCE(
          (
            SELECT MAX(\`level_configs\`.\`level\`)
            FROM \`level_configs\`
            WHERE IFNULL(\`level_configs\`.\`is_deleted\`, 0) = 0
              AND \`level_configs\`.\`required_xp\` <= \`palaces\`.\`required_xp\`
          ),
          1
        )
        WHERE \`level\` <= 0;
      `);
    } else {
      expoDb.execSync('UPDATE `palaces` SET `level` = 1 WHERE `level` <= 0;');
    }
  } catch (error) {
    console.warn('Schema compatibility patch skipped:', error);
  }
};

const ensureMissionCacheTables = () => {
  try {
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS \`missions\` (
        \`key\` text PRIMARY KEY NOT NULL,
        \`title\` text NOT NULL,
        \`description\` text,
        \`metric_type\` text NOT NULL,
        \`period\` text NOT NULL,
        \`current_value\` integer DEFAULT 0 NOT NULL,
        \`target_value\` integer DEFAULT 0 NOT NULL,
        \`reward_xp\` integer DEFAULT 0 NOT NULL,
        \`sort_order\` integer DEFAULT 0 NOT NULL,
        \`is_active\` integer DEFAULT true NOT NULL,
        \`is_completed\` integer DEFAULT false NOT NULL,
        \`progress_percent\` integer DEFAULT 0 NOT NULL,
        \`generated_at_utc\` text,
        \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`last_synced_at\` text,
        \`is_deleted\` integer DEFAULT false NOT NULL,
        \`deleted_at\` text
      );
    `);

    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS \`mission_ui_configs\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`payload\` text NOT NULL,
        \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`last_synced_at\` text,
        \`is_deleted\` integer DEFAULT false NOT NULL,
        \`deleted_at\` text
      );
    `);
  } catch (error) {
    console.warn('Mission cache table compatibility patch skipped:', error);
  }
};

const ensureFeatureLimitTables = () => {
  try {
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS \`feature_limits\` (
        \`user_id\` text PRIMARY KEY NOT NULL,
        \`is_premium\` integer DEFAULT false NOT NULL,
        \`custom_palaces\` integer DEFAULT 0 NOT NULL,
        \`custom_lessons_per_palace\` integer DEFAULT 0 NOT NULL,
        \`custom_locations_per_palace\` integer DEFAULT 0 NOT NULL,
        \`custom_words_per_lesson\` integer DEFAULT 0 NOT NULL,
        \`created_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`updated_at\` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        \`last_synced_at\` text,
        \`is_deleted\` integer DEFAULT false NOT NULL,
        \`deleted_at\` text
      );
    `);
  } catch (error) {
    console.warn('Feature limits table compatibility patch skipped:', error);
  }
};

const ensureBadgeConditionColumns = () => {
  try {
    const badgeColumns = getTableColumns('badges');
    if (badgeColumns.length === 0) return;

    const hasConditionType = badgeColumns.some((column) => column.name === 'condition_type');
    if (!hasConditionType) {
      expoDb.execSync(
        "ALTER TABLE `badges` ADD COLUMN `condition_type` text NOT NULL DEFAULT 'manual';"
      );
    }

    const hasConditionValue = badgeColumns.some((column) => column.name === 'condition_value');
    if (!hasConditionValue) {
      expoDb.execSync('ALTER TABLE `badges` ADD COLUMN `condition_value` integer NOT NULL DEFAULT 0;');
    }
  } catch (error) {
    console.warn('Badge condition schema compatibility patch skipped:', error);
  }
};

ensurePalaceLevelColumn();
ensureMissionCacheTables();
ensureFeatureLimitTables();
ensureBadgeConditionColumns();

export const db = drizzle(expoDb, { schema });
