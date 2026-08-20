import { Injectable, Logger } from '@nestjs/common';

import { AuthRepository } from '../../api/auth/repo/auth.repository';
import { ICronTask } from '../interfaces/task.interface';

@Injectable()
export class DeleteExpiresJwtJob implements ICronTask {
    private readonly logger = new Logger(DeleteExpiresJwtJob.name);

    constructor(private readonly authRepository: AuthRepository) {}

    async execute(): Promise<void> {
        const deleted = await this.authRepository.deleteExpiredRefreshTokens();
        this.logger.log(`Deleted expired refresh tokens: ${deleted}`);
    }
}
