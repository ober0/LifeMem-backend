import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { cronConfig } from './cron.config';
import { ICronTask } from './interfaces/task.interface';

@Injectable()
export class CronWorker implements OnModuleInit {
    private readonly logger = new Logger(CronWorker.name);

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    onModuleInit(): void {
        for (const config of cronConfig) {
            const job = this.moduleRef.get<ICronTask>(config.job, { strict: false });

            const cron = new CronJob(config.schedule, async () => {
                this.logger.log(`Starting ${config.name}`);

                try {
                    await job.execute();
                } catch (error) {
                    this.logger.error(`Cron failed: ${config.name} `, error);
                }

                this.logger.log(`Success end ${config.name}`);
            });

            this.schedulerRegistry.addCronJob(config.name, cron);

            cron.start();

            this.logger.log(`Registered ${config.name}`);
        }
    }
}
