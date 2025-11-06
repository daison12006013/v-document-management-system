import { eq, and, or, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userPermissions,
} from '@/database/schema';

// Role queries
export async function getRole(id: string) {
  return db.query.roles.findFirst({
    where: eq(roles.id, id),
  }) || null;
}

export async function getRoleByName(name: string) {
  return db.query.roles.findFirst({
    where: eq(roles.name, name),
  }) || null;
}

export async function listRoles() {
  return db.query.roles.findMany({
    orderBy: [desc(roles.createdAt)],
  });
}

export async function createRole(data: { name: string; description?: string }) {
  const id = randomUUID();
  await db.insert(roles).values({ ...data, id });
  return getRole(id);
}

export async function updateRole(id: string, data: { name?: string; description?: string }) {
  await db.update(roles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(roles.id, id));
  return getRole(id);
}

export async function deleteRole(id: string) {
  await db.delete(roles).where(eq(roles.id, id));
}

// Permission queries
export async function getPermission(id: string) {
  return db.query.permissions.findFirst({
    where: eq(permissions.id, id),
  }) || null;
}

export async function getPermissionByName(name: string) {
  return db.query.permissions.findFirst({
    where: eq(permissions.name, name),
  }) || null;
}

export async function listPermissions() {
  return db.query.permissions.findMany({
    orderBy: [permissions.resource, permissions.action],
  });
}

export async function createPermission(data: {
  name: string;
  resource: string;
  action: string;
  description?: string;
}) {
  const id = randomUUID();
  await db.insert(permissions).values({ ...data, id });
  return getPermission(id);
}

// Role-Permission queries
export async function getRolePermissions(roleId: string) {
  return db.query.rolePermissions.findMany({
    where: eq(rolePermissions.roleId, roleId),
    with: {
      permission: true,
    },
  });
}

export async function addPermissionToRole(roleId: string, permissionId: string) {
  // Check if the relationship already exists
  const existing = await db.query.rolePermissions.findFirst({
    where: and(
      eq(rolePermissions.roleId, roleId),
      eq(rolePermissions.permissionId, permissionId)
    ),
  });

  // Only insert if it doesn't exist
  if (!existing) {
    await db.insert(rolePermissions).values({ roleId, permissionId });
  }
}

export async function clearRolePermissions(roleId: string) {
  await db.delete(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));
}

// User-Role queries
export async function assignRoleToUser(userId: string, roleId: string, assignedBy?: string) {
  await db.insert(userRoles)
    .values({ userId, roleId, assignedBy: assignedBy || null })
    .onDuplicateKeyUpdate({
      set: {
        deletedAt: null,
        assignedAt: new Date(),
        assignedBy: assignedBy || null,
      },
    });
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  await db.update(userRoles)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId),
        sql`${userRoles.deletedAt} IS NULL`
      )
    );
}

// User-Permission queries
export async function assignPermissionToUser(
  userId: string,
  permissionId: string,
  assignedBy?: string
) {
  await db.insert(userPermissions)
    .values({ userId, permissionId, assignedBy: assignedBy || null })
    .onDuplicateKeyUpdate({
      set: {
        deletedAt: null,
        assignedAt: new Date(),
        assignedBy: assignedBy || null,
      },
    });
}

export async function removePermissionFromUser(userId: string, permissionId: string) {
  await db.update(userPermissions)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permissionId, permissionId),
        sql`${userPermissions.deletedAt} IS NULL`
      )
    );
}

// Permission checking with wildcard support
export async function checkUserPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // MySQL doesn't have PL/pgSQL functions, so we'll do this in TypeScript
  const requiredPermission = `${resource}:${action}`;

  // Get user roles and direct permissions in parallel
  const [userRolesList, directPerms] = await Promise.all([
    db.query.userRoles.findMany({
      where: and(
        eq(userRoles.userId, userId),
        sql`${userRoles.deletedAt} IS NULL`
      ),
    }),
    db.query.userPermissions.findMany({
      where: and(
        eq(userPermissions.userId, userId),
        sql`${userPermissions.deletedAt} IS NULL`
      ),
      with: { permission: true },
    }),
  ]);

  const roleIds = userRolesList.map(ur => ur.roleId);

  // Get permissions from roles
  const rolePerms = roleIds.length > 0
    ? await db.query.rolePermissions.findMany({
        where: (rp, { inArray }) => inArray(rp.roleId, roleIds),
        with: { permission: true },
      })
    : [];

  // Combine all permissions
  const allPerms = [
    ...rolePerms.map(rp => rp.permission),
    ...directPerms.map(up => up.permission),
  ].filter(Boolean) as typeof permissions.$inferSelect[];

  // Check for exact match or wildcard matches
  for (const perm of allPerms) {
    if (!perm) continue;

    // Exact match
    if (perm.name === requiredPermission) return true;

    // Wildcard: resource:* matches all actions on resource
    if (perm.resource === resource && perm.action === '*') return true;

    // Wildcard: *:action matches action on all resources
    if (perm.resource === '*' && perm.action === action) return true;

    // Wildcard: *:* matches everything
    if (perm.resource === '*' && perm.action === '*') return true;
  }

  return false;
}

export async function checkUserPermissionByName(
  userId: string,
  permissionName: string
): Promise<boolean> {
  const [resource, action] = permissionName.split(':');
  if (!resource || !action) return false;
  return checkUserPermission(userId, resource, action);
}

