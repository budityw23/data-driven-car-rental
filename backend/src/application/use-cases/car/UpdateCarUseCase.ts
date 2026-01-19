import { Car, CarType, Transmission, FuelType, CarStatus } from '../../../domain/entities/index.js';
import { NotFoundError, ConflictError } from '../../../domain/errors/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';

export interface UpdateCarInput {
  brand?: string;
  model?: string;
  year?: number;
  type?: CarType;
  seats?: number;
  transmission?: Transmission;
  fuel?: FuelType;
  dailyPrice?: number;
  images?: string[];
  status?: CarStatus;
}

export class UpdateCarUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(carId: string, input: UpdateCarInput): Promise<Car> {
    // Check if car exists
    const existingCar = await this.carRepository.findById(carId);
    if (!existingCar) {
      throw new NotFoundError('Car', carId);
    }

    // If updating to MAINTENANCE or INACTIVE, check for active bookings
    if (input.status && ['MAINTENANCE', 'INACTIVE'].includes(input.status)) {
      const hasActiveBookings = await this.carRepository.hasActiveBookings(carId);
      if (hasActiveBookings) {
        throw new ConflictError(
          'Cannot update car status. There are active bookings for this car.',
          'ACTIVE_BOOKINGS_EXIST'
        );
      }
    }

    return this.carRepository.update(carId, input);
  }
}
