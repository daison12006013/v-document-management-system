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


