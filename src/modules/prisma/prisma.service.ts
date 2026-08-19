import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            this.logger.warn('PostgreSQL недоступен при старте; health/postgres вернёт 503', error as Error);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
