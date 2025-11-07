/**
 * User utility functions
 * Centralized helpers for user-related operations
 */

/**
 * Exclude password field from user object
 */
export function excludePassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}


