import type { NestMiddleware } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { HttpMethod } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import type { LogsCreateDto } from '../../api/logs/dto/base.dto';
import { LogsService } from '../../api/logs/logs.service';
import { DelayedWorkerService } from '../../api/delayed-worker/delayed-worker.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger: Logger = new Logger(LoggerMiddleware.name);

    constructor(
        private readonly loggerService: LogsService,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const method = req.method;
        const url = req.originalUrl;

        this.logger.log(`START [${method}] ${url}`);

        res.on('finish', () => {
            const status = res.statusCode;
            const duration = Date.now() - start;

            if (Number(status) >= 400 && Number(status) < 500) {
                this.logger.log(`END WITH ERROR [${method}] ${url} [CODE: ${status}] - ${duration}ms`);
            } else if (Number(status) >= 500) {
                this.logger.error(`END WITH ERROR [${method}] ${url} [CODE: ${status}] - ${duration}ms`);
            } else {
                this.logger.log(`END [${method}] ${url} [CODE: ${status}] - ${duration}ms`);
            }

            this.delayedWorker.setImmediate(() => {
                const data: LogsCreateDto = {
                    code: status,
                    method: (method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()) as HttpMethod,
                    userId: req.actor.user?.id,
                    path: req.path,
                    duration,
                    ip: req.ip
                };

                return this.loggerService.create(data);
            });
        });

        next();
    }
}
