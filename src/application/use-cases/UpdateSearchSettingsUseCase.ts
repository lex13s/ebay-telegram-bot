import { UserId } from '../../domain/value-objects/UserId';
import { SearchConfigKey } from '../../domain/value-objects/SearchConfigKey';
import { UserService } from '../services/UserService';
import { ILogger } from '../../infrastructure/logging/Logger';

export interface UpdateSearchSettingsRequest {
  userId: UserId;
  newConfigKey: SearchConfigKey;
}

/**
 * Use case for updating user search settings
 */
export class UpdateSearchSettingsUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly logger: ILogger
  ) {}

  public async execute(request: UpdateSearchSettingsRequest): Promise<void> {
    this.logger.info('Updating search settings', {
      userId: request.userId.getValue(),
      newConfigKey: request.newConfigKey.toString(),
    });

    await this.userService.updateSearchConfig(request.userId, request.newConfigKey);

    this.logger.info('Search settings updated', {
      userId: request.userId.getValue(),
      newConfigKey: request.newConfigKey.toString(),
    });
  }
}
