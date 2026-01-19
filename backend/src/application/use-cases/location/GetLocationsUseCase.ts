import { Location } from '../../../domain/entities/index.js';
import { ILocationRepository } from '../../../domain/repositories/index.js';

export class GetLocationsUseCase {
  constructor(private locationRepository: ILocationRepository) {}

  async execute(activeOnly: boolean = true): Promise<Location[]> {
    return this.locationRepository.findAll(activeOnly);
  }
}
