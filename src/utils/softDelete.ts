import { sql } from 'drizzle-orm';

/**
 * Soft Delete Utility Helper
 * Provides reusable functions for soft delete operations across repositories
 */

/**
 * SQL fragment to filter out deleted records
 * Usage: .where(softDeleteFilter(schema.myTable))
 */
export function softDeleteFilter(table: any) {
  return sql`${table.isDeleted} = 0`;
}

/**
 * Get soft delete columns for insert/update operations
 * Usage when soft-deleting a record
 */
export function getSoftDeleteColumns() {
  const now = new Date().toISOString();
  return {
    isDeleted: true,
    deletedAt: now,
    updatedAt: now,
  };
}

/**
 * Get initialization columns for new records
 * Usage when creating a new record
 */
export function getInitialDeleteColumns() {
  return {
    isDeleted: false,
    deletedAt: null,
  };
}
