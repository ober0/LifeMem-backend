import { Injectable, Logger } from '@nestjs/common';

import { AuthCleanupService } from '../../api/auth/services/auth-cleanup.service';
import type { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class DeleteExpiresConfirmCodesJob implements ICronTask {
    private readonly logger = new Logger(DeleteExpiresConfirmCodesJob.name);

    constructor(private readonly authCleanup: AuthCleanupService) {}

    async execute(): Promise<void> {
        const deleted = await this.authCleanup.deleteExpiredConfirmationCodes();
        this.logger.log(`Deleted expired confirm codes: ${deleted}`);
    }
}
