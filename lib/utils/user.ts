/**
 * User utility functions
 * Centralized helpers for user-related operations
 */

import type { User } from '@/lib/types';

/**
 * Exclude password field from user object
 */
export function excludePassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Exclude password from array of users
 */
export function excludePasswordFromUsers<T extends { password?: string }>(
  users: T[]
): Array<Omit<T, 'password'>> {
  return users.map(excludePassword);
}

