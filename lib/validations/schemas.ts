/**
 * Validation schemas using Zod
 * Centralized input validation for all API endpoints
 */

import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User schemas
export const createUserSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.email('Invalid email format').optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(255, 'Role name must be less than 255 characters'),
  description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(255, 'Role name must be less than 255 characters').optional(),
  description: z.string().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// Permission schemas
export const assignRoleSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
});

export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

export const assignPermissionSchema = z.object({
  permissionId: z.string().min(1, 'Permission ID is required'),
});

export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;

// File schemas
export const createFileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  parentId: z.string().optional().nullable(),
  type: z.enum(['file', 'folder'], {
    message: 'Type must be "file" or "folder"',
  }),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;

export const updateFileSchema = z.object({
  name: z.string().min(1, 'File name is required').optional(),
  parentId: z.string().nullable().optional(),
});

export type UpdateFileInput = z.infer<typeof updateFileSchema>;

