import { PrismaClient, Addon } from '@prisma/client';
import { IAddonRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class AddonRepository implements IAddonRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(activeOnly: boolean = true): Promise<Addon[]> {
    return this.db.addon.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Addon | null> {
    return this.db.addon.findUnique({
      where: { id },
    });
  }

  async findByIds(ids: string[]): Promise<Addon[]> {
    return this.db.addon.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    pricePerBooking: number;
  }): Promise<Addon> {
    return this.db.addon.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerBooking: data.pricePerBooking,
        isActive: true,
      },
    });
  }
}
