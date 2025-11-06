import { mysqlTable, varchar, text, timestamp, char, primaryKey } from 'drizzle-orm/mysql-core';
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
});

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
}));

export const userPermissions = mysqlTable('user_permissions', {
  userId: char('user_id', { length: 36 }).notNull(),
  permissionId: char('permission_id', { length: 36 }).notNull(),
  assignedAt: timestamp('assigned_at', { fsp: 6 }).defaultNow().notNull(),
  assignedBy: char('assigned_by', { length: 36 }),
  deletedAt: timestamp('deleted_at', { fsp: 6 }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.permissionId] }),
}));

// Relations are defined in relations.ts to avoid circular dependencies

