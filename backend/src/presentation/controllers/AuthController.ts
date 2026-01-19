import { Request, Response } from 'express';
import { RegisterUseCase, LoginUseCase, GetProfileUseCase } from '../../application/use-cases/auth/index.js';
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';
import { AuthenticatedRequest } from '../../shared/types/index.js';

// Initialize repository and use cases
const userRepository = new UserRepository();
const registerUseCase = new RegisterUseCase(userRepository);
const loginUseCase = new LoginUseCase(userRepository);
const getProfileUseCase = new GetProfileUseCase(userRepository);

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    const { email, name, password } = req.body;

    const result = await registerUseCase.execute({ email, name, password });

    return sendCreated(res, result);
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    const result = await loginUseCase.execute({ email, password });

    return sendSuccess(res, result);
  }

  static async getProfile(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.user.id;

    const user = await getProfileUseCase.execute(userId);

    return sendSuccess(res, user);
  }
}
