import { Injectable } from '@nestjs/common';

import { appConstants } from '../../common/config/app.constants';
import { UserRepository } from './user.repository';

@Injectable()
export class UserCleanupService {
    constructor(private readonly userRepository: UserRepository) {}

    async purgeExpiredSoftDeletedUsers(): Promise<number> {
        const deletedBefore = new Date(Date.now() - appConstants.user.softDeleteRetentionMs);
        const users = await this.userRepository.findSoftDeletedBefore(deletedBefore);

        let deleted = 0;

        for (const user of users) {
            const result = await this.userRepository.adminDelete(user.id);
            if (result) {
                deleted++;
            }
        }

        return deleted;
    }
}
