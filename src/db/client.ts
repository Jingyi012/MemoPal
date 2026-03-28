import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('memopal.db');

type UserVersionRow = { user_version: number };
type TableNameRow = { name: string };

// One-time forced reset to recover from legacy runtime schema patches.
// Increase this marker to trigger another one-time full reset when needed.
const HARD_RESET_DB_MARKER = 2026032801;

const getUserVersion = () => {
  const row = expoDb.getAllSync<UserVersionRow>('PRAGMA user_version;')[0];
  return Number(row?.user_version ?? 0);
};

const setUserVersion = (value: number) => {
  expoDb.execSync(`PRAGMA user_version = ${Math.max(0, Math.trunc(value))};`);
};

const dropAllTablesOnceForMigrationRecovery = () => {
  const currentVersion = getUserVersion();
  if (currentVersion >= HARD_RESET_DB_MARKER) return;

  try {
    const tables = expoDb.getAllSync<TableNameRow>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';"
    );

    expoDb.execSync('PRAGMA foreign_keys = OFF;');
    for (const table of tables) {
      if (!table?.name) continue;
      const safeName = table.name.replace(/"/g, '""');
      expoDb.execSync(`DROP TABLE IF EXISTS "${safeName}";`);
    }
    expoDb.execSync('PRAGMA foreign_keys = ON;');

    setUserVersion(HARD_RESET_DB_MARKER);
    console.warn(`[DB] One-time hard reset complete. Dropped ${tables.length} tables.`);
  } catch (error) {
    console.error('[DB] Failed to hard reset local database:', error);
    throw error;
  }
};

dropAllTablesOnceForMigrationRecovery();

export const db = drizzle(expoDb, { schema });
