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

ensurePalaceLevelColumn();

export const db = drizzle(expoDb, { schema });
