import { count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, roles, permissions } from '@/database/schema';
import { getRecentActivities } from './activities';

// Count users
export async function countUsers() {
  const result = await db.select({ count: count() }).from(users);
  return { count: result[0]?.count || 0 };
}

// Count roles
export async function countRoles() {
  const result = await db.select({ count: count() }).from(roles);
  return { count: result[0]?.count || 0 };
}

// Count permissions
export async function countPermissions() {
  const result = await db.select({ count: count() }).from(permissions);
  return { count: result[0]?.count || 0 };
}

// Get recent activities (re-export from activities)
export { getRecentActivities } from './activities';

