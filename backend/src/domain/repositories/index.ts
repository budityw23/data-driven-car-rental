import {
  User,
  Car,
  Location,
  Addon,
  Booking,
  BookingWithRelations,
  CarWithAvailability,
  UserRole,
  CarStatus,
  BookingStatus,
} from '../entities/index.js';

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// User Repository
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// Car Repository
export interface CarFilters {
  type?: string;
  seats?: number;
  transmission?: string;
  fuel?: string;
  priceMin?: number;
  priceMax?: number;
  status?: CarStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface CarSortOptions {
  field: 'dailyPrice' | 'createdAt' | 'seats' | 'year';
  order: 'asc' | 'desc';
}

export interface ICarRepository {
  findAll(
    filters: CarFilters,
    pagination: PaginationParams,
    sort?: CarSortOptions
  ): Promise<PaginatedResult<CarWithAvailability>>;
  findById(id: string): Promise<Car | null>;
  create(data: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car>;
  update(id: string, data: Partial<Car>): Promise<Car>;
  updateStatus(id: string, status: CarStatus): Promise<Car>;
  checkAvailability(carId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean>;
  hasActiveBookings(carId: string): Promise<boolean>;
}

// Location Repository
export interface ILocationRepository {
  findAll(activeOnly?: boolean): Promise<Location[]>;
  findById(id: string): Promise<Location | null>;
  create(data: { name: string; address?: string }): Promise<Location>;
}

// Addon Repository
export interface IAddonRepository {
  findAll(activeOnly?: boolean): Promise<Addon[]>;
  findById(id: string): Promise<Addon | null>;
  findByIds(ids: string[]): Promise<Addon[]>;
  create(data: { name: string; description?: string; pricePerBooking: number }): Promise<Addon>;
}

// Booking Repository
export interface BookingFilters {
  userId?: string;
  carId?: string;
  status?: BookingStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface BookingSortOptions {
  field: 'createdAt' | 'startDate' | 'totalPrice';
  order: 'asc' | 'desc';
}

export interface CreateBookingData {
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  startDate: Date;
  endDate: Date;
  days: number;
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  addonIds: string[];
  addonPrices: Map<string, number>;
}

export interface IBookingRepository {
  findById(id: string, includeRelations?: boolean): Promise<BookingWithRelations | null>;
  findByUserId(
    userId: string,
    filters: Omit<BookingFilters, 'userId'>,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>>;
  findAll(
    filters: BookingFilters,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>>;
  create(data: CreateBookingData): Promise<BookingWithRelations>;
  updateStatus(id: string, status: BookingStatus, cancelReason?: string): Promise<Booking>;
  checkOverlap(carId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean>;
}

// Audit Log Repository
export interface IAuditLogRepository {
  create(data: {
    actorId?: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeJson?: object;
    afterJson?: object;
  }): Promise<void>;
}
