import { eq, desc, sql, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { users, userRoles, userPermissions } from '@/database/schema';
import { roles, permissions } from '@/database/schema';

// Get user by ID
export async function getUser(id: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return result || null;
}

// Get user by email
export async function getUserByEmail(email: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  return result || null;
}

// List all users
export async function listUsers() {
  return db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });
}

// Create user
export async function createUser(data: {
  email: string;
  name: string;
  password: string;
}) {
  const id = randomUUID();
  await db.insert(users).values({ ...data, id });
  return getUser(id);
}

// Update user
export async function updateUser(id: string, data: {
  email?: string;
  name?: string;
}) {
  await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id));
  return getUser(id);
}

// Delete user
export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

// Get user roles (excluding deleted)
export async function getUserRoles(userId: string) {
  const result = await db.query.userRoles.findMany({
    where: and(
      eq(userRoles.userId, userId),
      isNull(userRoles.deletedAt)
    ),
    with: {
      role: true,
    },
  });

  // Filter out any entries where the role relation is null (role was deleted)
  return result.filter(ur => ur.role !== null && ur.role !== undefined);
}

// Get user permissions (direct, excluding deleted)
export async function getUserDirectPermissions(userId: string) {
  const result = await db.query.userPermissions.findMany({
    where: and(
      eq(userPermissions.userId, userId),
      isNull(userPermissions.deletedAt)
    ),
    with: {
      permission: true,
    },
  });

  // Filter out any entries where the permission relation is null (permission was deleted)
  return result.filter(up => up.permission !== null && up.permission !== undefined);
}

// Get all user permissions (from roles + direct)
export async function getUserPermissions(userId: string) {
  // Get roles and direct permissions in parallel
  const [userRolesList, directPermissions] = await Promise.all([
    getUserRoles(userId),
    getUserDirectPermissions(userId),
  ]);
  const roleIds = userRolesList.map(ur => ur.roleId);

  // Get permissions from roles
  const rolePermissions = roleIds.length > 0
    ? await db.query.rolePermissions.findMany({
        where: (rp, { inArray }) => inArray(rp.roleId, roleIds),
        with: {
          permission: true,
        },
      })
    : [];

  // Combine and deduplicate
  const allPermissions = new Map<string, typeof permissions.$inferSelect>();

  rolePermissions.forEach(rp => {
    if (rp.permission) {
      allPermissions.set(rp.permission.id, rp.permission);
    }
  });

  directPermissions.forEach(up => {
    if (up.permission) {
      allPermissions.set(up.permission.id, up.permission);
    }
  });

  return Array.from(allPermissions.values());
}

