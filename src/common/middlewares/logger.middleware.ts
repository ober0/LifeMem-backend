import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger: Logger = new Logger(LoggerMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const method = req.method;
        const url = req.originalUrl;

        this.logger.log(`START [${method}] ${url}`);

        res.on('finish', async () => {
            const status = res.statusCode;
            const duration = Date.now() - start;

            this.logger.log(`END [${method}] ${url} [CODE: ${status}] - ${duration}ms`);
        });

        next();
    }
}
