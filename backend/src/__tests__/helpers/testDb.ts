import { prisma } from '../../infrastructure/database/prisma.js';
import { UserRole, CarType, Transmission, FuelType, BookingStatus, CarStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function cleanDatabase() {
  // Delete in correct order to respect foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.bookingAddon.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.location.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(overrides?: any) {
  const passwordHash = await bcrypt.hash('Password123', 10);
  return prisma.user.create({
    data: {
      email: overrides?.email || 'test@example.com',
      name: overrides?.name || 'Test User',
      passwordHash,
      role: overrides?.role || UserRole.CUSTOMER,
    },
  });
}

export async function createTestAdmin() {
  return createTestUser({
    email: 'admin@example.com',
    name: 'Test Admin',
    role: UserRole.ADMIN,
  });
}

export async function createTestCar(overrides?: any) {
  return prisma.car.create({
    data: {
      brand: overrides?.brand || 'Toyota',
      model: overrides?.model || 'Camry',
      year: overrides?.year || 2023,
      type: overrides?.type || CarType.SEDAN,
      seats: overrides?.seats || 5,
      transmission: overrides?.transmission || Transmission.AT,
      fuel: overrides?.fuel || FuelType.GAS,
      dailyPrice: overrides?.dailyPrice || '500000',
      status: overrides?.status || CarStatus.ACTIVE,
      images: overrides?.images || ['camry-1.jpg'],
    },
  });
}

export async function createTestLocation(overrides?: any) {
  return prisma.location.create({
    data: {
      name: overrides?.name || 'Jakarta Airport',
      address: overrides?.address || 'CGK International Airport',
      isActive: overrides?.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

export async function createTestAddon(overrides?: any) {
  return prisma.addon.create({
    data: {
      name: overrides?.name || 'GPS Navigation',
      description: overrides?.description || 'GPS device rental',
      pricePerBooking: overrides?.pricePerBooking || '50000',
      isActive: overrides?.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

export async function createTestBooking(userId: string, carId: string, pickupLocationId: string, dropoffLocationId: string, overrides?: any) {
  const startDate = overrides?.startDate || new Date('2026-02-01');
  const endDate = overrides?.endDate || new Date('2026-02-05');
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return prisma.booking.create({
    data: {
      userId,
      carId,
      pickupLocationId,
      dropoffLocationId,
      startDate,
      endDate,
      days,
      basePrice: overrides?.basePrice || '2000000',
      addonPrice: overrides?.addonPrice || '0',
      totalPrice: overrides?.totalPrice || '2000000',
      status: overrides?.status || BookingStatus.PENDING,
    },
  });
}
