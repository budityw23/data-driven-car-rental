import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});
