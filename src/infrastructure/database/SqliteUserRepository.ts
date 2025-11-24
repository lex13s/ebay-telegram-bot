import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Balance } from '../../domain/value-objects/Balance';
import { SearchConfigKey } from '../../domain/value-objects/SearchConfigKey';
import { DatabaseConnection } from './DatabaseConnection';
import { ILogger } from '../logging/Logger';

interface UserRow {
  user_id: number;
  username: string | null;
  balance_cents: number;
  search_config_key: string;
}

export class SqliteUserRepository implements IUserRepository {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly logger: ILogger
  ) {}

  public async findById(userId: UserId): Promise<User | null> {
    try {
      const row = await this.db.get<UserRow>('SELECT * FROM users WHERE user_id = ?', [
        userId.getValue(),
      ]);

      if (!row) {
        return null;
      }

      return this.mapRowToEntity(row);
    } catch (error) {
      this.logger.error('Failed to find user by id', error as Error, {
        userId: userId.getValue(),
      });
      throw error;
    }
  }

  public async save(user: User): Promise<void> {
    try {
      await this.db.run(
        `INSERT OR REPLACE INTO users (user_id, username, balance_cents, search_config_key)
         VALUES (?, ?, ?, ?)`,
        [
          user.getUserId().getValue(),
          user.getUsername(),
          user.getBalance().getCents(),
          user.getSearchConfigKey().getValue(),
        ]
      );
    } catch (error) {
      this.logger.error('Failed to save user', error as Error, {
        userId: user.getUserId().getValue(),
      });
      throw error;
    }
  }

  public async createNew(
    userId: UserId,
    username: string | null,
    trialBalance: Balance
  ): Promise<User> {
    try {
      const user = User.createNew(userId, username, trialBalance);
      await this.save(user);
      return user;
    } catch (error) {
      this.logger.error('Failed to create new user', error as Error, {
        userId: userId.getValue(),
      });
      throw error;
    }
  }

  public async getOrCreate(
    userId: UserId,
    username: string | null,
    trialBalance: Balance
  ): Promise<User> {
    const existingUser = await this.findById(userId);

    if (existingUser) {
      return existingUser;
    }

    return await this.createNew(userId, username, trialBalance);
  }

  public async updateBalance(userId: UserId, newBalance: Balance): Promise<void> {
    try {
      await this.db.run('UPDATE users SET balance_cents = ? WHERE user_id = ?', [
        newBalance.getCents(),
        userId.getValue(),
      ]);
    } catch (error) {
      this.logger.error('Failed to update balance', error as Error, {
        userId: userId.getValue(),
      });
      throw error;
    }
  }

  public async updateSearchConfig(userId: UserId, configKey: SearchConfigKey): Promise<void> {
    try {
      await this.db.run('UPDATE users SET search_config_key = ? WHERE user_id = ?', [
        configKey.getValue(),
        userId.getValue(),
      ]);
    } catch (error) {
      this.logger.error('Failed to update search config', error as Error, {
        userId: userId.getValue(),
      });
      throw error;
    }
  }

  private mapRowToEntity(row: UserRow): User {
    return User.create(
      UserId.create(row.user_id),
      row.username,
      Balance.create(row.balance_cents),
      SearchConfigKey.create(row.search_config_key)
    );
  }
}
