import { NestFactory } from '@nestjs/core';

import { EntryProcessingWorkerModule } from './entry-processing-worker/entry-processing.worker.module';

async function bootstrap() {
    await NestFactory.createApplicationContext(EntryProcessingWorkerModule);
}

bootstrap();
