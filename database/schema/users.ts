import { mysqlTable, varchar, boolean, timestamp, char } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';

export const users = mysqlTable('users', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  isSystemAccount: boolean('is_system_account').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
