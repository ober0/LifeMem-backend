import { Module } from '@nestjs/common';

import { LogsController } from './logs.controller';
import { LogsRepository } from './logs.repository';
import { LogsService } from './logs.service';

@Module({
    controllers: [LogsController],
    providers: [LogsService, LogsRepository],
    exports: [LogsService]
})
export class LogsModule {}
