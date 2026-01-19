import { UserWithoutPassword } from '../../../domain/entities/index.js';
import { NotFoundError } from '../../../domain/errors/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';

export class GetProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
