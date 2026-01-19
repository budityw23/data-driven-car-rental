import { Addon } from '../../../domain/entities/index.js';
import { IAddonRepository } from '../../../domain/repositories/index.js';

export class GetAddonsUseCase {
  constructor(private addonRepository: IAddonRepository) {}

  async execute(activeOnly: boolean = true): Promise<Addon[]> {
    return this.addonRepository.findAll(activeOnly);
  }
}
