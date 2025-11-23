import { User } from '../entities/User';
import { UserId } from '../value-objects/UserId';
import { Balance } from '../value-objects/Balance';
import { SearchConfigKey } from '../value-objects/SearchConfigKey';

export interface IUserRepository {
  findById(userId: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  createNew(userId: UserId, username: string | null, trialBalance: Balance): Promise<User>;
  getOrCreate(userId: UserId, username: string | null, trialBalance: Balance): Promise<User>;
  updateBalance(userId: UserId, newBalance: Balance): Promise<void>;
  updateSearchConfig(userId: UserId, configKey: SearchConfigKey): Promise<void>;
}

