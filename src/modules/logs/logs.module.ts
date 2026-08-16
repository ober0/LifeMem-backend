import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LogsController } from './logs.controller';
import { LogsRepository } from './logs.repository';
import { LogsService } from './logs.service';

@Module({
    imports: [AuthModule],
    controllers: [LogsController],
    providers: [LogsService, LogsRepository],
    exports: [LogsService]
})
export class LogsModule {}
