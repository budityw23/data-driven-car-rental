import { IBookingRepository, BookingFilters, BookingSortOptions, PaginationParams, PaginatedResult } from '../../../domain/repositories/index.js';
import { BookingWithRelations } from '../../../domain/entities/index.js';

export interface GetAllBookingsInput {
  filters: BookingFilters;
  pagination: PaginationParams;
  sort?: BookingSortOptions;
}

export class GetAllBookingsUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(input: GetAllBookingsInput): Promise<PaginatedResult<BookingWithRelations>> {
    return this.bookingRepository.findAll(input.filters, input.pagination, input.sort);
  }
}
