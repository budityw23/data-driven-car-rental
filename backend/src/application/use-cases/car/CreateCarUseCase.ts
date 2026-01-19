import { Car, CarType, Transmission, FuelType } from '../../../domain/entities/index.js';
import { ICarRepository } from '../../../domain/repositories/index.js';

export interface CreateCarInput {
  brand: string;
  model: string;
  year: number;
  type: CarType;
  seats: number;
  transmission: Transmission;
  fuel: FuelType;
  dailyPrice: number;
  images?: string[];
}

export class CreateCarUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(input: CreateCarInput): Promise<Car> {
    return this.carRepository.create({
      brand: input.brand,
      model: input.model,
      year: input.year,
      type: input.type,
      seats: input.seats,
      transmission: input.transmission,
      fuel: input.fuel,
      dailyPrice: input.dailyPrice,
      images: input.images || [],
      status: 'ACTIVE',
    });
  }
}
