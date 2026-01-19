import { Request, Response } from 'express';
import { GetLocationsUseCase } from '../../application/use-cases/location/GetLocationsUseCase.js';
import { LocationRepository } from '../../infrastructure/repositories/LocationRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';

// Initialize repository and use case
const locationRepository = new LocationRepository();
const getLocationsUseCase = new GetLocationsUseCase(locationRepository);

export class LocationController {
  static async getLocations(req: Request, res: Response): Promise<Response> {
    const locations = await getLocationsUseCase.execute(true);

    return sendSuccess(res, locations);
  }
}
