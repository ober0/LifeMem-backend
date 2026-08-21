import { Module } from '@nestjs/common';

import { AuthRepository } from './repo/auth.repository';
import { AuthCleanupService } from './services/auth-cleanup.service';

@Module({
    providers: [AuthRepository, AuthCleanupService],
    exports: [AuthRepository, AuthCleanupService]
})
export class AuthCleanupModule {}
