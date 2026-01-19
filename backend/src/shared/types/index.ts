import { Request } from 'express';
import { UserRole } from '../../domain/entities/index.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
