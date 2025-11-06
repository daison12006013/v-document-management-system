import { mysqlTable, varchar, text, timestamp, char, json, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const activities = mysqlTable('activities', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  userId: char('user_id', { length: 36 }),
  action: varchar('action', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 255 }).notNull(),
  resourceId: char('resource_id', { length: 36 }),
  description: text('description'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
}, (table) => ({
  userIdIdx: index('activities_user_id_idx').on(table.userId),
  resourceTypeIdx: index('activities_resource_type_idx').on(table.resourceType),
  resourceIdIdx: index('activities_resource_id_idx').on(table.resourceId),
  createdAtIdx: index('activities_created_at_idx').on(table.createdAt),
  // Composite indexes for common query patterns
  userCreatedIdx: index('activities_user_created_idx').on(table.userId, table.createdAt),
  resourceTypeCreatedIdx: index('activities_resource_type_created_idx').on(table.resourceType, table.createdAt),
}));


