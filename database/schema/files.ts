import { mysqlTable, varchar, text, timestamp, char, bigint, mysqlEnum, json } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Unified files table for both files and folders
export const files = mysqlTable('files', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['file', 'folder']).notNull(),
  parentId: char('parent_id', { length: 36 }),
  path: text('path').notNull(),

  // File-specific fields (NULL for folders)
  originalName: varchar('original_name', { length: 255 }),
  mimeType: varchar('mime_type', { length: 100 }),
  size: bigint('size', { mode: 'number' }),
  storagePath: text('storage_path'),
  storageDriver: mysqlEnum('storage_driver', ['local', 's3', 'r2']),
  checksum: varchar('checksum', { length: 64 }),

  // Common fields
  createdBy: char('created_by', { length: 36 }).notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
  updatedAt: timestamp('updated_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
  deletedAt: timestamp('deleted_at', { fsp: 6 }),
});
// Note: Indexes will be created via migrations for better compatibility

// File shares table for future sharing functionality
export const fileShares = mysqlTable('file_shares', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  fileId: char('file_id', { length: 36 }).notNull(),
  sharedWith: char('shared_with', { length: 36 }).notNull(),
  sharedBy: char('shared_by', { length: 36 }).notNull(),
  permissions: mysqlEnum('permissions', ['read', 'write', 'delete']).notNull(),
  expiresAt: timestamp('expires_at', { fsp: 6 }),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
});
// Note: Indexes will be created via migrations for better compatibility

