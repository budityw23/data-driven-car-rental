import { BookingWithRelations } from '../../../domain/entities/index.js';
import { NotFoundError, ConflictError, ValidationError } from '../../../domain/errors/index.js';
import { IBookingRepository, ICarRepository, ILocationRepository, IAddonRepository } from '../../../domain/repositories/index.js';
import { calculateDays, isPastDate } from '../../../shared/utils/date.js';

export interface CreateBookingInput {
  userId: string;
  carId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  startDate: Date;
  endDate: Date;
  addonIds?: string[];
}

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: IBookingRepository,
    private carRepository: ICarRepository,
    private locationRepository: ILocationRepository,
    private addonRepository: IAddonRepository
  ) {}

  async execute(input: CreateBookingInput): Promise<BookingWithRelations> {
    // Validate dates
    if (isPastDate(input.startDate)) {
      throw new ValidationError('Start date cannot be in the past', [
        { field: 'startDate', message: 'Start date must be today or in the future' },
      ]);
    }

    if (input.endDate <= input.startDate) {
      throw new ValidationError('End date must be after start date', [
        { field: 'endDate', message: 'End date must be after start date' },
      ]);
    }

    // Check if car exists and is active
    const car = await this.carRepository.findById(input.carId);
    if (!car) {
      throw new NotFoundError('Car', input.carId);
    }
    if (car.status !== 'ACTIVE') {
      throw new ConflictError('Car is not available for booking', 'CAR_NOT_AVAILABLE');
    }

    // Check if car is available for the requested dates
    const isAvailable = await this.carRepository.checkAvailability(
      input.carId,
      input.startDate,
      input.endDate
    );
    if (!isAvailable) {
      throw new ConflictError(
        'Car is not available for the selected dates',
        'CAR_NOT_AVAILABLE'
      );
    }

    // Validate locations
    const [pickupLocation, dropoffLocation] = await Promise.all([
      this.locationRepository.findById(input.pickupLocationId),
      this.locationRepository.findById(input.dropoffLocationId),
    ]);

    if (!pickupLocation) {
      throw new NotFoundError('Pickup location', input.pickupLocationId);
    }
    if (!dropoffLocation) {
      throw new NotFoundError('Dropoff location', input.dropoffLocationId);
    }

    // Calculate days and base price
    const days = calculateDays(input.startDate, input.endDate);
    const basePrice = Number(car.dailyPrice) * days;

    // Process addons
    let addonPrice = 0;
    const addonPrices = new Map<string, number>();

    if (input.addonIds && input.addonIds.length > 0) {
      const addons = await this.addonRepository.findByIds(input.addonIds);

      if (addons.length !== input.addonIds.length) {
        throw new ValidationError('Some add-ons were not found', [
          { field: 'addonIds', message: 'Invalid addon IDs provided' },
        ]);
      }

      for (const addon of addons) {
        const price = Number(addon.pricePerBooking);
        addonPrice += price;
        addonPrices.set(addon.id, price);
      }
    }

    // Create booking
    const booking = await this.bookingRepository.create({
      userId: input.userId,
      carId: input.carId,
      pickupLocationId: input.pickupLocationId,
      dropoffLocationId: input.dropoffLocationId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      basePrice,
      addonPrice,
      totalPrice: basePrice + addonPrice,
      addonIds: input.addonIds || [],
      addonPrices,
    });

    return booking;
  }
}
