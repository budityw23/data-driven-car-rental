import { ICarRepository, IBookingRepository } from '../../../domain/repositories/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';

export interface CheckAvailabilityInput {
  carId: string;
  startDate: Date;
  endDate: Date;
}

export interface ConflictingBooking {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface CheckAvailabilityOutput {
  available: boolean;
  carId: string;
  requestedStartDate: Date;
  requestedEndDate: Date;
  conflictingBookings: ConflictingBooking[];
}

export class CheckAvailabilityUseCase {
  constructor(
    private carRepository: ICarRepository,
    private bookingRepository: IBookingRepository
  ) {}

  async execute(input: CheckAvailabilityInput): Promise<CheckAvailabilityOutput> {
    // Check if car exists
    const car = await this.carRepository.findById(input.carId);
    if (!car) {
      throw new NotFoundError('Car', input.carId);
    }

    // Check availability
    const isAvailable = await this.carRepository.checkAvailability(
      input.carId,
      input.startDate,
      input.endDate
    );

    // Get conflicting bookings if not available
    let conflictingBookings: ConflictingBooking[] = [];

    if (!isAvailable) {
      const bookings = await this.bookingRepository.findConflicting(
        input.carId,
        input.startDate,
        input.endDate
      );

      conflictingBookings = bookings.map(booking => ({
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        status: booking.status,
      }));
    }

    return {
      available: isAvailable && car.status === 'ACTIVE',
      carId: input.carId,
      requestedStartDate: input.startDate,
      requestedEndDate: input.endDate,
      conflictingBookings,
    };
  }
}
