import { BookingWithRelations } from '../../../domain/entities/index.js';
import { NotFoundError, ForbiddenError } from '../../../domain/errors/index.js';
import { IBookingRepository } from '../../../domain/repositories/index.js';
import { UserRole } from '../../../domain/entities/index.js';

export class GetBookingByIdUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(bookingId: string, userId: string, userRole: UserRole): Promise<BookingWithRelations> {
    const booking = await this.bookingRepository.findById(bookingId, true);

    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    // Only allow user to see their own bookings, unless they're an admin
    if (userRole !== UserRole.ADMIN && booking.userId !== userId) {
      throw new ForbiddenError('You can only view your own bookings');
    }

    return booking;
  }
}
