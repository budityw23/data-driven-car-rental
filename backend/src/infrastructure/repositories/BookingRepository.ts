import { PrismaClient, Booking, BookingStatus, Prisma } from '@prisma/client';
import {
  IBookingRepository,
  BookingFilters,
  BookingSortOptions,
  PaginationParams,
  PaginatedResult,
  CreateBookingData,
} from '../../domain/repositories/index.js';
import { BookingWithRelations } from '../../domain/entities/index.js';
import { prisma } from '../database/prisma.js';
import { buildPaginationMeta } from '../../shared/utils/pagination.js';

export class BookingRepository implements IBookingRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async findById(id: string, includeRelations: boolean = true): Promise<BookingWithRelations | null> {
    return this.db.booking.findUnique({
      where: { id },
      include: includeRelations
        ? {
            user: true,
            car: true,
            pickupLocation: true,
            dropoffLocation: true,
            bookingAddons: {
              include: {
                addon: true,
              },
            },
          }
        : undefined,
    });
  }

  async findByUserId(
    userId: string,
    filters: Omit<BookingFilters, 'userId'>,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>> {
    return this.findAll({ ...filters, userId }, pagination, sort);
  }

  async findAll(
    filters: BookingFilters,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>> {
    const where: Prisma.BookingWhereInput = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.carId && { carId: filters.carId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDateFrom && { startDate: { gte: filters.startDateFrom } }),
      ...(filters.startDateTo && {
        startDate: {
          ...(filters.startDateFrom ? { gte: filters.startDateFrom } : {}),
          lte: filters.startDateTo,
        },
      }),
    };

    const orderBy: Prisma.BookingOrderByWithRelationInput = sort
      ? { [sort.field]: sort.order }
      : { createdAt: 'desc' };

    const [bookings, total] = await Promise.all([
      this.db.booking.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy,
        include: {
          user: true,
          car: true,
          pickupLocation: true,
          dropoffLocation: true,
          bookingAddons: {
            include: {
              addon: true,
            },
          },
        },
      }),
      this.db.booking.count({ where }),
    ]);

    const meta = buildPaginationMeta(pagination.page, pagination.limit, total);

    return {
      data: bookings,
      meta,
    };
  }

  async create(data: CreateBookingData): Promise<BookingWithRelations> {
    return this.db.booking.create({
      data: {
        userId: data.userId,
        carId: data.carId,
        pickupLocationId: data.pickupLocationId,
        dropoffLocationId: data.dropoffLocationId,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        basePrice: data.basePrice,
        addonPrice: data.addonPrice,
        totalPrice: data.totalPrice,
        status: 'PENDING',
        bookingAddons: {
          create: data.addonIds.map((addonId) => ({
            addonId,
            price: data.addonPrices.get(addonId) || 0,
          })),
        },
      },
      include: {
        user: true,
        car: true,
        pickupLocation: true,
        dropoffLocation: true,
        bookingAddons: {
          include: {
            addon: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: BookingStatus, cancelReason?: string): Promise<Booking> {
    return this.db.booking.update({
      where: { id },
      data: {
        status,
        ...(cancelReason && { cancelReason }),
      },
    });
  }

  async checkOverlap(
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

    return overlappingBookings > 0;
  }

  async findConflicting(
    carId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    return this.db.booking.findMany({
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
      orderBy: { startDate: 'asc' },
    });
  }
}
