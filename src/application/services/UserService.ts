import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Balance } from '../../domain/value-objects/Balance';
import { SearchConfigKey } from '../../domain/value-objects/SearchConfigKey';
import { UserNotFoundError } from '../../domain/errors/DomainErrors';
import { ILogger } from '../../infrastructure/logging/Logger';

/**
 * Service for managing users
 */
export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly trialBalance: Balance,
    private readonly logger: ILogger
  ) {}

  public async getOrCreateUser(userId: UserId, username: string | null): Promise<User> {
    this.logger.debug('Getting or creating user', { userId: userId.getValue() });

    const user = await this.userRepository.getOrCreate(userId, username, this.trialBalance);

    this.logger.debug('User obtained', {
      userId: userId.getValue(),
      balance: user.getBalance().getCents()
    });

    return user;
  }

  public async getUser(userId: UserId): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId.getValue());
    }

    return user;
  }

  public async updateBalance(userId: UserId, newBalance: Balance): Promise<void> {
    this.logger.debug('Updating user balance', {
      userId: userId.getValue(),
      newBalance: newBalance.getCents()
    });

    await this.userRepository.updateBalance(userId, newBalance);
  }

  public async updateSearchConfig(userId: UserId, configKey: SearchConfigKey): Promise<void> {
    this.logger.debug('Updating user search config', {
      userId: userId.getValue(),
      configKey: configKey.toString()
    });

    await this.userRepository.updateSearchConfig(userId, configKey);
  }

  public async saveUser(user: User): Promise<void> {
    await this.userRepository.save(user);
  }
}

