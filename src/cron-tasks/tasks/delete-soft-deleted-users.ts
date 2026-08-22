import { Injectable, Logger } from '@nestjs/common';

import { UserCleanupService } from '../../api/user/user-cleanup.service';
import type { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class DeleteSoftDeletedUsersJob implements ICronTask {
    private readonly logger = new Logger(DeleteSoftDeletedUsersJob.name);

    constructor(private readonly userCleanup: UserCleanupService) {}

    async execute(): Promise<void> {
        const deleted = await this.userCleanup.purgeExpiredSoftDeletedUsers();
        this.logger.log(`Hard deleted soft-deleted users: ${deleted}`);
    }
}
