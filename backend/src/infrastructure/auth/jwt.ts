import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/index.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

export function generateToken(payload: JwtPayload): TokenPair {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    accessToken,
    expiresIn: JWT_EXPIRES_IN,
  };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
