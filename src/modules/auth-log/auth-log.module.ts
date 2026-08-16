import { Module } from '@nestjs/common';
import { AuthLogController } from './auth-log.controller';
import { AuthLogRepository } from './auth-log.repository';
import { AuthLogService } from './auth-log.service';

@Module({
    controllers: [AuthLogController],
    providers: [AuthLogService, AuthLogRepository],
    exports: [AuthLogService]
})
export class AuthLogModule {}
