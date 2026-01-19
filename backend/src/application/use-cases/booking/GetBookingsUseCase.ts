import { BookingWithRelations } from '../../../domain/entities/index.js';
import { IBookingRepository, BookingFilters, PaginationParams, BookingSortOptions, PaginatedResult } from '../../../domain/repositories/index.js';

export class GetBookingsUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(
    userId: string,
    filters: Omit<BookingFilters, 'userId'>,
    pagination: PaginationParams,
    sort?: BookingSortOptions
  ): Promise<PaginatedResult<BookingWithRelations>> {
    return this.bookingRepository.findByUserId(userId, filters, pagination, sort);
  }
}
