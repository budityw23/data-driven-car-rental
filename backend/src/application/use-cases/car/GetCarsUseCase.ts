import {
  ICarRepository,
  CarFilters,
  CarSortOptions,
  PaginationParams,
  PaginatedResult
} from '../../../domain/repositories/index.js';
import { CarWithAvailability } from '../../../domain/entities/index.js';

export class GetCarsUseCase {
  constructor(private carRepository: ICarRepository) {}

  async execute(
    filters: CarFilters,
    pagination: PaginationParams,
    sort?: CarSortOptions
  ): Promise<PaginatedResult<CarWithAvailability>> {
    return this.carRepository.findAll(filters, pagination, sort);
  }
}
