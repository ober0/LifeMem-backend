import { NestFactory } from '@nestjs/core';

import { CronModule } from './cron-tasks/cron.module';

async function bootstrap() {
    await NestFactory.createApplicationContext(CronModule);
}

bootstrap();
