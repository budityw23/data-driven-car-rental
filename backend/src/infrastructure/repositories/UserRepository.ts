import { PrismaClient, User, UserRole } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class UserRepository implements IUserRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User> {
    return this.db.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || UserRole.CUSTOMER,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }
}
