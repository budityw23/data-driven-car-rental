import { UserWithoutPassword } from '../../../domain/entities/index.js';
import { UnauthorizedError } from '../../../domain/errors/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';
import { comparePassword, generateToken, TokenPair } from '../../../infrastructure/auth/index.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: UserWithoutPassword;
  token: TokenPair;
}

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}
