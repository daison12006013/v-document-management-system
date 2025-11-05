import { mysqlTable, varchar, text, timestamp, char, json } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';
import { users } from './users';

export const activities = mysqlTable('activities', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 255 }).notNull(),
  resourceId: char('resource_id', { length: 36 }),
  description: text('description'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


