import { Injectable, Logger } from '@nestjs/common';

import { AuthCleanupService } from '../../api/auth/services/auth-cleanup.service';
import type { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class DeleteExpiresJwtJob implements ICronTask {
    private readonly logger = new Logger(DeleteExpiresJwtJob.name);

    constructor(private readonly authCleanup: AuthCleanupService) {}

    async execute(): Promise<void> {
        const deleted = await this.authCleanup.deleteExpiredRefreshTokens();
        this.logger.log(`Deleted expired refresh tokens: ${deleted}`);
    }
}
