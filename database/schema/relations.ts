import { relations } from 'drizzle-orm';
import { users } from './users';
import { roles, permissions, userRoles, userPermissions, rolePermissions } from './rbac';
import { activities } from './activities';
import { files, fileShares } from './files';

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  directPermissions: many(userPermissions),
  activities: many(activities),
  assignedUserRoles: many(userRoles, { relationName: 'assignedBy' }),
  assignedUserPermissions: many(userPermissions, { relationName: 'assignedBy' }),
  files: many(files, { relationName: 'createdBy' }),
  sharedFiles: many(fileShares, { relationName: 'sharedBy' }),
  receivedShares: many(fileShares, { relationName: 'sharedWith' }),
}));

// Roles relations
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

// Permissions relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
  users: many(userPermissions),
}));

// Role-Permission relations
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// User-Role relations
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: 'assignedBy',
  }),
}));

// User-Permission relations
export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
  assignedByUser: one(users, {
    fields: [userPermissions.assignedBy],
    references: [users.id],
    relationName: 'assignedBy',
  }),
}));

// Activities relations
export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Files relations
export const filesRelations = relations(files, ({ one, many }) => ({
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
    relationName: 'parent',
  }),
  children: many(files, { relationName: 'parent' }),
  creator: one(users, {
    fields: [files.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  shares: many(fileShares),
}));

// File shares relations
export const fileSharesRelations = relations(fileShares, ({ one }) => ({
  file: one(files, {
    fields: [fileShares.fileId],
    references: [files.id],
  }),
  sharedWithUser: one(users, {
    fields: [fileShares.sharedWith],
    references: [users.id],
    relationName: 'sharedWith',
  }),
  sharedByUser: one(users, {
    fields: [fileShares.sharedBy],
    references: [users.id],
    relationName: 'sharedBy',
  }),
}));

