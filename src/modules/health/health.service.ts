import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { S3Service } from '../s3/s3.service';
import { HealthServiceName, HealthServiceStatusDto, HealthStatus } from './dto/health-status.dto';

@Injectable()
export class HealthService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly s3: S3Service
    ) {}

    async check(): Promise<HealthServiceStatusDto[]> {
        const results = await Promise.all([this.checkApp(), this.checkPostgres(), this.checkRedis(), this.checkS3()]);

        if (results.some((item) => item.status === HealthStatus.ERROR)) {
            throw new HttpException(results, HttpStatus.SERVICE_UNAVAILABLE);
        }

        return results;
    }

    private async checkApp(): Promise<HealthServiceStatusDto> {
        return { status: HealthStatus.OK, service: HealthServiceName.APP };
    }

    private async checkPostgres(): Promise<HealthServiceStatusDto> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: HealthStatus.OK, service: HealthServiceName.POSTGRES };
        } catch {
            return { status: HealthStatus.ERROR, service: HealthServiceName.POSTGRES };
        }
    }

    private async checkRedis(): Promise<HealthServiceStatusDto> {
        try {
            if (this.redis.status !== 'ready') {
                await this.redis.connect();
            }

            const pong = await Promise.race([
                this.redis.ping(),
                new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('redis ping timeout')), 1500);
                })
            ]);

            if (pong !== 'PONG') {
                throw new Error('unexpected ping response');
            }

            return { status: HealthStatus.OK, service: HealthServiceName.REDIS };
        } catch {
            return { status: HealthStatus.ERROR, service: HealthServiceName.REDIS };
        }
    }

    private async checkS3(): Promise<HealthServiceStatusDto> {
        try {
            await this.s3.ping();
            return { status: HealthStatus.OK, service: HealthServiceName.S3 };
        } catch {
            return { status: HealthStatus.ERROR, service: HealthServiceName.S3 };
        }
    }
}
