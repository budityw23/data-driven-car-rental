import {
  User as PrismaUser,
  Car as PrismaCar,
  Location as PrismaLocation,
  Addon as PrismaAddon,
  Booking as PrismaBooking,
  BookingAddon as PrismaBookingAddon,
  AuditLog as PrismaAuditLog,
  UserRole,
  CarType,
  Transmission,
  FuelType,
  CarStatus,
  BookingStatus,
} from '@prisma/client';

// Re-export enums
export { UserRole, CarType, Transmission, FuelType, CarStatus, BookingStatus };

// Entity types
export type User = PrismaUser;
export type Car = PrismaCar;
export type Location = PrismaLocation;
export type Addon = PrismaAddon;
export type Booking = PrismaBooking;
export type BookingAddon = PrismaBookingAddon;
export type AuditLog = PrismaAuditLog;

// Booking with relations
export interface BookingWithRelations extends Booking {
  user?: User;
  car?: Car;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  bookingAddons?: (BookingAddon & { addon?: Addon })[];
}

// Car with availability flag
export interface CarWithAvailability extends Car {
  isAvailable?: boolean;
}

// User without password
export type UserWithoutPassword = Omit<User, 'passwordHash'>;
