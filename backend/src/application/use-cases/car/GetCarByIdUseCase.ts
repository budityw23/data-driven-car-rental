import { Car } from '../../../domain/entities/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';

export class GetCarByIdUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(carId: string): Promise<Car> {
    const car = await this.carRepository.findById(carId);

    if (!car) {
      throw new NotFoundError('Car', carId);
    }

    return car;
  }
}
