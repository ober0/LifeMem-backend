import { Injectable, Logger } from '@nestjs/common';

import { AuthRepository } from '../../api/auth/repo/auth.repository';
import { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class DeleteExpiresConfirmCodesJob implements ICronTask {
    private readonly logger = new Logger(DeleteExpiresConfirmCodesJob.name);

    constructor(private readonly authRepository: AuthRepository) {}

    async execute(): Promise<void> {
        const deleted = await this.authRepository.deleteExpiredConfirmationCodes();
        this.logger.log(`Deleted expired confirm codes: ${deleted}`);
    }
}
