import { Global, Module } from '@nestjs/common';

import { DelayedWorkerService } from './delayed-worker.service';

@Global()
@Module({
    providers: [DelayedWorkerService],
    exports: [DelayedWorkerService]
})
export class DelayedWorkerModule {}
