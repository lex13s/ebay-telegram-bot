import { UserId } from '../value-objects/UserId';
import { Balance } from '../value-objects/Balance';
import { SearchConfigKey } from '../value-objects/SearchConfigKey';

export class User {
  private constructor(
    private readonly userId: UserId,
    private username: string | null,
    private balance: Balance,
    private searchConfigKey: SearchConfigKey
  ) {}

  public static create(
    userId: UserId,
    username: string | null,
    balance: Balance,
    searchConfigKey: SearchConfigKey
  ): User {
    return new User(userId, username, balance, searchConfigKey);
  }

  public static createNew(userId: UserId, username: string | null, trialBalance: Balance): User {
    return new User(userId, username, trialBalance, SearchConfigKey.default());
  }

  public getUserId(): UserId {
    return this.userId;
  }

  public getUsername(): string | null {
    return this.username;
  }

  public getBalance(): Balance {
    return this.balance;
  }

  public getSearchConfigKey(): SearchConfigKey {
    return this.searchConfigKey;
  }

  public deductBalance(amount: Balance): void {
    this.balance = this.balance.subtract(amount);
  }

  public addBalance(amount: Balance): void {
    this.balance = this.balance.add(amount);
  }

  public hasBalance(amount: Balance): boolean {
    return this.balance.isGreaterThanOrEqual(amount);
  }

  public updateSearchConfig(newConfig: SearchConfigKey): void {
    this.searchConfigKey = newConfig;
  }

  public updateUsername(username: string | null): void {
    this.username = username;
  }
}
