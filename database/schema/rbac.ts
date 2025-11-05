import { mysqlTable, varchar, text, timestamp, char, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { users } from './users';

export const roles = mysqlTable('roles', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const permissions = mysqlTable('permissions', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  resource: varchar('resource', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const rolePermissions = mysqlTable('role_permissions', {
  roleId: char('role_id', { length: 36 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: char('permission_id', { length: 36 }).notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoles = mysqlTable('user_roles', {
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: char('role_id', { length: 36 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: char('assigned_by', { length: 36 }).references(() => users.id),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const userPermissions = mysqlTable('user_permissions', {
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: char('permission_id', { length: 36 }).notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: char('assigned_by', { length: 36 }).references(() => users.id),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.permissionId] }),
}));

// Relations are defined in relations.ts to avoid circular dependencies

