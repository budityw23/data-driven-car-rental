import { Request, Response } from 'express';
import {
  CreateBookingUseCase,
  GetBookingsUseCase,
  GetBookingByIdUseCase,
  CancelBookingUseCase,
} from '../../application/use-cases/booking/index.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { CarRepository } from '../../infrastructure/repositories/CarRepository.js';
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository.js';
import { AddonRepository } from '../../infrastructure/repositories/AddonRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { parsePagination } from '../../shared/utils/pagination.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { BookingFilters, BookingSortOptions } from '../../domain/repositories/index.js';

// Initialize repositories
const bookingRepository = new BookingRepository();
const carRepository = new CarRepository();
const locationRepository = new LocationRepository();
const addonRepository = new AddonRepository();

// Initialize use cases
const createBookingUseCase = new CreateBookingUseCase(
  bookingRepository,
  carRepository,
  locationRepository,
  addonRepository
);
const getBookingsUseCase = new GetBookingsUseCase(bookingRepository);
const getBookingByIdUseCase = new GetBookingByIdUseCase(bookingRepository);
const cancelBookingUseCase = new CancelBookingUseCase(bookingRepository);

export class BookingController {
  static async createBooking(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.id;
    const bookingData = req.body;

    const booking = await createBookingUseCase.execute({
      userId,
      ...bookingData,
    });

    return sendCreated(res, booking);
  }

  static async getBookings(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.id;
    const query = req.query;

    // Parse pagination
    const pagination = parsePagination({
      page: query.page as string,
      limit: query.limit as string,
    });

    // Parse filters
    const filters: Omit<BookingFilters, 'userId'> = {
      status: query.status as any,
      startDateFrom: query.startDateFrom ? new Date(query.startDateFrom as string) : undefined,
      startDateTo: query.startDateTo ? new Date(query.startDateTo as string) : undefined,
    };

    // Parse sort
    const sort: BookingSortOptions | undefined =
      query.sortBy && query.sortOrder
        ? {
            field: query.sortBy as any,
            order: query.sortOrder as 'asc' | 'desc',
          }
        : undefined;

    const result = await getBookingsUseCase.execute(userId, filters, pagination, sort);

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async getBookingById(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.id;
    const userRole = authenticatedReq.user.role;
    const { id } = req.params;

    const booking = await getBookingByIdUseCase.execute(id, userId, userRole);

    return sendSuccess(res, booking);
  }

  static async cancelBooking(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.id;
    const userRole = authenticatedReq.user.role;
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await cancelBookingUseCase.execute({
      bookingId: id,
      userId,
      userRole,
      cancelReason: reason,
    });

    return sendSuccess(res, booking);
  }
}
