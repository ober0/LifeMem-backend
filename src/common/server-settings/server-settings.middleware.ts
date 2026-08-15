import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ServiceSettingsService } from '../../modules/service-settings/service-settings.service';
import { ServerSettings } from './server-settings';

@Injectable()
export class ServerSettingsMiddleware implements NestMiddleware {
    constructor(private readonly serviceSettingsService: ServiceSettingsService) {}

    async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
        const json = await this.serviceSettingsService.getJsonForRequest();
        req.serverSettings = ServerSettings.create(json);
        next();
    }
}
