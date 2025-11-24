import { UserId } from '../../domain/value-objects/UserId';
import { PartNumber } from '../../domain/value-objects/PartNumber';
import { Balance } from '../../domain/value-objects/Balance';
import { SearchResult } from '../../domain/entities/SearchResult';
import { InsufficientFundsError } from '../../domain/errors/DomainErrors';
import { UserService } from '../services/UserService';
import { EbaySearchService } from '../services/EbaySearchService';
import { ILogger } from '../../infrastructure/logging/Logger';

export interface ProcessSearchRequest {
  userId: UserId;
  username: string | null;
  partNumbers: PartNumber[];
  isAdmin: boolean;
}

export interface ProcessSearchResponse {
  results: SearchResult[];
  cost: Balance;
  newBalance: Balance;
  refunded: boolean;
}

/**
 * Use case for processing search requests
 */
export class ProcessSearchUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly ebaySearchService: EbaySearchService,
    private readonly costPerRequest: Balance,
    private readonly logger: ILogger
  ) {}

  public async execute(request: ProcessSearchRequest): Promise<ProcessSearchResponse> {
    this.logger.info('Processing search request', {
      userId: request.userId.getValue(),
      partNumbersCount: request.partNumbers.length,
      isAdmin: request.isAdmin,
    });

    const user = await this.userService.getOrCreateUser(request.userId, request.username);

    const totalCost = request.isAdmin
      ? Balance.create(0)
      : Balance.create(this.costPerRequest.getCents() * request.partNumbers.length);

    if (!request.isAdmin && !user.hasBalance(totalCost)) {
      this.logger.warn('Insufficient funds', {
        userId: request.userId.getValue(),
        required: totalCost.getCents(),
        available: user.getBalance().getCents(),
      });
      throw new InsufficientFundsError(totalCost.getCents(), user.getBalance().getCents());
    }

    if (!request.isAdmin) {
      user.deductBalance(totalCost);
      await this.userService.saveUser(user);
    }

    try {
      const results = await this.ebaySearchService.search(
        request.partNumbers,
        user.getSearchConfigKey()
      );

      const foundResults = results.filter((r) => r.isFound());

      if (foundResults.length === 0 && !request.isAdmin) {
        user.addBalance(totalCost);
        await this.userService.saveUser(user);

        this.logger.info('Search completed with no results - refunded', {
          userId: request.userId.getValue(),
          refundedAmount: totalCost.getCents(),
        });

        return {
          results,
          cost: totalCost,
          newBalance: user.getBalance(),
          refunded: true,
        };
      }

      this.logger.info('Search completed successfully', {
        userId: request.userId.getValue(),
        totalResults: results.length,
        foundResults: foundResults.length,
        cost: totalCost.getCents(),
      });

      return {
        results,
        cost: totalCost,
        newBalance: user.getBalance(),
        refunded: false,
      };
    } catch (error) {
      if (!request.isAdmin) {
        user.addBalance(totalCost);
        await this.userService.saveUser(user);
      }

      this.logger.error('Search failed - refunded', error as Error, {
        userId: request.userId.getValue(),
      });

      throw error;
    }
  }
}
