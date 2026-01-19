import { Request, Response } from 'express';
import {
  GetAllBookingsUseCase,
  UpdateBookingStatusUseCase,
  GetDashboardStatsUseCase,
} from '../../application/use-cases/admin/index.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { AuditLogRepository } from '../../infrastructure/repositories/AuditLogRepository.js';
import { AnalyticsRepository } from '../../infrastructure/repositories/AnalyticsRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { parsePagination } from '../../shared/utils/pagination.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';
import { BookingFilters, BookingSortOptions } from '../../domain/repositories/index.js';

const bookingRepository = new BookingRepository();
const auditLogRepository = new AuditLogRepository();
const analyticsRepository = new AnalyticsRepository();

const getAllBookingsUseCase = new GetAllBookingsUseCase(bookingRepository);
const updateBookingStatusUseCase = new UpdateBookingStatusUseCase(bookingRepository, auditLogRepository);
const getDashboardStatsUseCase = new GetDashboardStatsUseCase(analyticsRepository);

export class AdminController {
  static async getAllBookings(req: Request, res: Response): Promise<Response> {
    const query = req.query;

    // Parse pagination
    const pagination = parsePagination({
      page: query.page as string,
      limit: query.limit as string,
    });

    // Parse filters
    const filters: BookingFilters = {
      userId: query.userId as string | undefined,
      carId: query.carId as string | undefined,
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

    const result = await getAllBookingsUseCase.execute({
      filters,
      pagination,
      sort,
    });

    return sendSuccess(res, result.data, 200, result.meta);
  }

  static async updateBookingStatus(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const { user } = authenticatedReq;
    const { id } = req.params;
    const { status, reason } = req.body;

    const booking = await updateBookingStatusUseCase.execute({
      bookingId: id,
      status,
      adminId: user.id,
      reason,
    });

    return sendSuccess(res, booking);
  }

  static async getDashboardStats(req: Request, res: Response): Promise<Response> {
    const stats = await getDashboardStatsUseCase.execute();

    return sendSuccess(res, stats);
  }
}
