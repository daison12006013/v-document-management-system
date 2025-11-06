import { mysqlTable, varchar, text, timestamp, char, primaryKey, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const roles = mysqlTable('roles', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
  updatedAt: timestamp('updated_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
});

export const permissions = mysqlTable('permissions', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 255 }).notNull().unique(),
  resource: varchar('resource', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
  updatedAt: timestamp('updated_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
}, (table) => ({
  resourceIdx: index('resource_idx').on(table.resource),
  actionIdx: index('action_idx').on(table.action),
  // Composite index for common query pattern: find permission by resource and action
  resourceActionIdx: index('resource_action_idx').on(table.resource, table.action),
}));

export const rolePermissions = mysqlTable('role_permissions', {
  roleId: char('role_id', { length: 36 }).notNull(),
  permissionId: char('permission_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at', { fsp: 6 }).default(sql`CURRENT_TIMESTAMP(6)`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoles = mysqlTable('user_roles', {
  userId: char('user_id', { length: 36 }).notNull(),
  roleId: char('role_id', { length: 36 }).notNull(),
  assignedAt: timestamp('assigned_at', { fsp: 6 }).defaultNow().notNull(),
  assignedBy: char('assigned_by', { length: 36 }),
  deletedAt: timestamp('deleted_at', { fsp: 6 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  deletedAtIdx: index('user_roles_deleted_at_idx').on(table.deletedAt),
  // Composite index for common query: find active roles for a user
  userDeletedIdx: index('user_roles_user_deleted_idx').on(table.userId, table.deletedAt),
}));

export const userPermissions = mysqlTable('user_permissions', {
  userId: char('user_id', { length: 36 }).notNull(),
  permissionId: char('permission_id', { length: 36 }).notNull(),
  assignedAt: timestamp('assigned_at', { fsp: 6 }).defaultNow().notNull(),
  assignedBy: char('assigned_by', { length: 36 }),
  deletedAt: timestamp('deleted_at', { fsp: 6 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.permissionId] }),
  userIdIdx: index('user_permissions_user_id_idx').on(table.userId),
  deletedAtIdx: index('user_permissions_deleted_at_idx').on(table.deletedAt),
  // Composite index for common query: find active permissions for a user
  userDeletedIdx: index('user_permissions_user_deleted_idx').on(table.userId, table.deletedAt),
}));

// Relations are defined in relations.ts to avoid circular dependencies

