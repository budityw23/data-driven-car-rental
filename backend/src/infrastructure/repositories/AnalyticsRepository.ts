import { PrismaClient, BookingStatus } from '@prisma/client';
import { prisma } from '../database/prisma.js';

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
}

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface FleetStats {
  totalCars: number;
  activeCars: number;
  inactiveCars: number;
  utilizationRate: number;
}

export interface TopCar {
  carId: string;
  brand: string;
  model: string;
  bookingCount: number;
  revenue: number;
}

export interface DashboardStats {
  revenue: RevenueStats;
  bookings: BookingStats;
  fleet: FleetStats;
  topCars: TopCar[];
}

export class AnalyticsRepository {
  private db: PrismaClient;

  constructor(db: PrismaClient = prisma) {
    this.db = db;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [revenue, bookings, fleet, topCars] = await Promise.all([
      this.getRevenueStats(),
      this.getBookingStats(),
      this.getFleetStats(),
      this.getTopCars(5),
    ]);

    return { revenue, bookings, fleet, topCars };
  }

  async getRevenueStats(): Promise<RevenueStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total revenue from completed bookings
    const totalRevenueResult = await this.db.booking.aggregate({
      where: { status: BookingStatus.RETURNED },
      _sum: { totalPrice: true },
      _count: true,
    });

    // Monthly revenue
    const monthlyRevenueResult = await this.db.booking.aggregate({
      where: {
        status: BookingStatus.RETURNED,
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalPrice: true },
    });

    const totalRevenue = Number(totalRevenueResult._sum.totalPrice || 0);
    const totalCount = totalRevenueResult._count || 1;
    const monthlyRevenue = Number(monthlyRevenueResult._sum.totalPrice || 0);

    return {
      totalRevenue,
      monthlyRevenue,
      averageBookingValue: totalCount > 0 ? totalRevenue / totalCount : 0,
    };
  }

  async getBookingStats(): Promise<BookingStats> {
    const statusCounts = await this.db.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    statusCounts.forEach(item => {
      counts[item.status] = item._count.status;
    });

    const totalBookings = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return {
      totalBookings,
      pendingBookings: counts[BookingStatus.PENDING] || 0,
      confirmedBookings: counts[BookingStatus.CONFIRMED] || 0,
      activeBookings: counts[BookingStatus.PICKED_UP] || 0,
      completedBookings: counts[BookingStatus.RETURNED] || 0,
      cancelledBookings: counts[BookingStatus.CANCELLED] || 0,
    };
  }

  async getFleetStats(): Promise<FleetStats> {
    const carCounts = await this.db.car.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    let activeCars = 0;
    let inactiveCars = 0;

    carCounts.forEach(item => {
      if (item.status === 'ACTIVE') {
        activeCars = item._count.status;
      } else {
        inactiveCars += item._count.status;
      }
    });

    const totalCars = activeCars + inactiveCars;

    // Calculate utilization: cars with active bookings / total active cars
    const carsWithActiveBookings = await this.db.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PICKED_UP] },
      },
      select: { carId: true },
      distinct: ['carId'],
    });

    const utilizationRate = activeCars > 0
      ? (carsWithActiveBookings.length / activeCars) * 100
      : 0;

    return {
      totalCars,
      activeCars,
      inactiveCars,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    };
  }

  async getTopCars(limit: number = 5): Promise<TopCar[]> {
    const topCarsRaw = await this.db.booking.groupBy({
      by: ['carId'],
      where: { status: BookingStatus.RETURNED },
      _count: { carId: true },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: limit,
    });

    const carIds = topCarsRaw.map(c => c.carId);
    const cars = await this.db.car.findMany({
      where: { id: { in: carIds } },
      select: { id: true, brand: true, model: true },
    });

    const carMap = new Map(cars.map(c => [c.id, c]));

    return topCarsRaw.map(item => {
      const car = carMap.get(item.carId);
      return {
        carId: item.carId,
        brand: car?.brand || 'Unknown',
        model: car?.model || 'Unknown',
        bookingCount: item._count.carId,
        revenue: Number(item._sum.totalPrice || 0),
      };
    });
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date): Promise<{ date: string; revenue: number }[]> {
    const bookings = await this.db.booking.findMany({
      where: {
        status: BookingStatus.RETURNED,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true, totalPrice: true },
    });

    // Group by date
    const revenueByDate = new Map<string, number>();
    bookings.forEach(booking => {
      const dateStr = booking.createdAt.toISOString().split('T')[0];
      const current = revenueByDate.get(dateStr) || 0;
      revenueByDate.set(dateStr, current + Number(booking.totalPrice));
    });

    return Array.from(revenueByDate.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
