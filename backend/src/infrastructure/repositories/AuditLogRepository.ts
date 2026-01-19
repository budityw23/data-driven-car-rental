import { PrismaClient } from '@prisma/client';
import { IAuditLogRepository } from '../../domain/repositories/index.js';
import { prisma } from '../database/prisma.js';

export class AuditLogRepository implements IAuditLogRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async create(data: {
    actorId?: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson?: object;
    afterJson?: object;
  }): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorId: data.actorId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson as any,
        afterJson: data.afterJson as any,
      },
    });
  }
}
