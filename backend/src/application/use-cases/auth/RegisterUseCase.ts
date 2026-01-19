import { User, UserWithoutPassword } from '../../../domain/entities/index.js';
import { ConflictError } from '../../../domain/errors/index.js';
import { IUserRepository } from '../../../domain/repositories/index.js';
import { hashPassword, generateToken, TokenPair } from '../../../infrastructure/auth/index.js';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface RegisterOutput {
  user: UserWithoutPassword;
  token: TokenPair;
}

export class RegisterUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

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
