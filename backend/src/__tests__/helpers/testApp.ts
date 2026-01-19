import app from '../../app.js';
import { generateToken } from '../../infrastructure/auth/jwt.js';
import { UserRole } from '@prisma/client';

export { app };

export function generateTestToken(userId: string, email: string, role: UserRole = UserRole.CUSTOMER) {
  return generateToken({ userId, email, role });
}

export function getAuthHeader(token: string) {
  return `Bearer ${token}`;
}
