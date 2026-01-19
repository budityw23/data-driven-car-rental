import { Request, Response } from 'express';
import { GetAddonsUseCase } from '../../application/use-cases/addon/GetAddonsUseCase.js';
import { AddonRepository } from '../../infrastructure/repositories/AddonRepository.js';
import { sendSuccess } from '../../shared/utils/response.js';

// Initialize repository and use case
const addonRepository = new AddonRepository();
const getAddonsUseCase = new GetAddonsUseCase(addonRepository);

export class AddonController {
  static async getAddons(req: Request, res: Response): Promise<Response> {
    const addons = await getAddonsUseCase.execute(true);

    return sendSuccess(res, addons);
  }
}
