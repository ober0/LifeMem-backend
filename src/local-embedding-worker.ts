import { NestFactory } from '@nestjs/core';

import { LocalEmbeddingWorkerModule } from './local-embedding/local-embedding.worker.module';

async function bootstrap() {
    await NestFactory.createApplicationContext(LocalEmbeddingWorkerModule);
}

bootstrap();
