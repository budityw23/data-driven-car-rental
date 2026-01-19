import { Booking, BookingStatus } from '../../../domain/entities/index.js';
import { IBookingRepository, IAuditLogRepository } from '../../../domain/repositories/index.js';
import { NotFoundError, ValidationError } from '../../../domain/errors/index.js';
import { BOOKING_STATUS_TRANSITIONS } from '../../../shared/constants/index.js';

export interface UpdateBookingStatusInput {
  bookingId: string;
  status: BookingStatus;
  adminId: string;
  reason?: string;
}

export class UpdateBookingStatusUseCase {
  constructor(
    private bookingRepository: IBookingRepository,
    private auditLogRepository: IAuditLogRepository
  ) {}

  async execute(input: UpdateBookingStatusInput): Promise<Booking> {
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', input.bookingId);
    }

    // Validate status transition
    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(input.status)) {
      throw new ValidationError(
        `Invalid status transition from '${booking.status}' to '${input.status}'`,
        [{
          field: 'status',
          message: `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
        }]
      );
    }

    // Update status
    const updatedBooking = await this.bookingRepository.updateStatus(
      input.bookingId,
      input.status,
      input.status === BookingStatus.CANCELLED ? input.reason : undefined
    );

    // Create audit log
    await this.auditLogRepository.create({
      actorId: input.adminId,
      entityType: 'Booking',
      entityId: input.bookingId,
      action: `STATUS_CHANGED_TO_${input.status}`,
      beforeJson: { status: booking.status },
      afterJson: { status: input.status, reason: input.reason },
    });

    return updatedBooking;
  }
}
