import { Booking, BookingStatus, UserRole } from '../../../domain/entities/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../domain/errors/index.js';
import { IBookingRepository } from '../../../domain/repositories/index.js';
import { BOOKING_STATUS_TRANSITIONS } from '../../../shared/constants/index.js';

export interface CancelBookingInput {
  bookingId: string;
  userId: string;
  userRole: UserRole;
  cancelReason: string;
}

export class CancelBookingUseCase {
  constructor(private bookingRepository: IBookingRepository) {}

  async execute(input: CancelBookingInput): Promise<Booking> {
    // Get booking
    const booking = await this.bookingRepository.findById(input.bookingId, false);

    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Only allow user to cancel their own bookings, unless they're an admin
    if (input.userRole !== UserRole.ADMIN && booking.userId !== input.userId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    // Check if cancellation is allowed based on current status
    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes('CANCELLED')) {
      throw new ConflictError(
        `Cannot cancel booking in ${booking.status} status`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Update booking status
    return this.bookingRepository.updateStatus(
      input.bookingId,
      BookingStatus.CANCELLED,
      input.cancelReason
    );
  }
}
