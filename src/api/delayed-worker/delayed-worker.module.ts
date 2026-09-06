import { Global, Module } from '@nestjs/common';

import { BullMqModule } from '../bullmq/bullmq.module';
import { DelayedWorkerService } from './delayed-worker.service';

@Global()
@Module({
    imports: [BullMqModule],
    providers: [DelayedWorkerService],
    exports: [DelayedWorkerService]
})
export class DelayedWorkerModule {}
