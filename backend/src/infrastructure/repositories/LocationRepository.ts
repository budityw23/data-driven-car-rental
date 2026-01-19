import { PrismaClient, Location } from '@prisma/client';
import { ILocationRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class LocationRepository implements ILocationRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(activeOnly: boolean = true): Promise<Location[]> {
    return this.db.location.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Location | null> {
    return this.db.location.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; address?: string }): Promise<Location> {
    return this.db.location.create({
      data: {
        name: data.name,
        address: data.address,
        isActive: true,
      },
    });
  }
}
