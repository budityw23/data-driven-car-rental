import { PrismaClient, Car, CarStatus, Prisma } from '@prisma/client';
import {
  ICarRepository,
  CarFilters,
  CarSortOptions,
  PaginationParams,
  PaginatedResult
} from '../../domain/repositories/index.js';
import { CarWithAvailability } from '../../domain/entities/index.js';
import { prisma } from '../database/prisma.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';

export class CarRepository implements ICarRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findAll(
    filters: CarFilters,
    pagination: PaginationParams,
    sort?: CarSortOptions
  ): Promise<PaginatedResult<CarWithAvailability>> {
    const where: Prisma.CarWhereInput = {
      ...(filters.type && { type: filters.type as any }),
      ...(filters.seats && { seats: filters.seats }),
      ...(filters.transmission && { transmission: filters.transmission as any }),
      ...(filters.fuel && { fuel: filters.fuel as any }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priceMin !== undefined && { dailyPrice: { gte: filters.priceMin } }),
      ...(filters.priceMax !== undefined && {
        dailyPrice: {
          ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
          lte: filters.priceMax
        }
      }),
    };

    const orderBy: Prisma.CarOrderByWithRelationInput = sort
      ? { [sort.field]: sort.order }
      : { createdAt: 'desc' };

    const [cars, total] = await Promise.all([
      this.db.car.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy,
      }),
      this.db.car.count({ where }),
    ]);

    // Check availability if date range is provided
    let carsWithAvailability: CarWithAvailability[] = cars;
    if (filters.startDate && filters.endDate) {
      carsWithAvailability = await Promise.all(
        cars.map(async (car) => ({
          ...car,
          isAvailable: await this.checkAvailability(car.id, filters.startDate!, filters.endDate!),
        }))
      );
    }

    const meta = buildPaginationMeta(pagination.page, pagination.limit, total);

    return {
      data: carsWithAvailability,
      meta,
    };
  }

  async findById(id: string): Promise<Car | null> {
    return this.db.car.findUnique({
      where: { id },
    });
  }

  async create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> {
    return this.db.car.create({
      data,
    });
  }

  async update(id: string, data: Partial<Car>): Promise<Car> {
    return this.db.car.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: CarStatus): Promise<Car> {
    return this.db.car.update({
      where: { id },
      data: { status },
    });
  }

  async checkAvailability(
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const overlappingBookings = await this.db.booking.count({
      where: {
        carId,
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        status: {
          in: ['PENDING', 'CONFIRMED', 'PICKED_UP'],
        },
        OR: [
          // New booking starts during existing booking
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          // New booking ends during existing booking
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          // New booking completely contains existing booking
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    });

    return overlappingBookings === 0;
  }

  async hasActiveBookings(carId: string): Promise<boolean> {
    const activeBookings = await this.db.booking.count({
      where: {
        carId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PICKED_UP'],
        },
      },
    });

    return activeBookings > 0;
  }
}
