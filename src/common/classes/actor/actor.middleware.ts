import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { getDeviceType } from '../../helpers/get-device-type';
import { getRequestIp } from '../../helpers/get-ip';
import { Actor } from './actor';

@Injectable()
export class ActorMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void {
        req.actor = Actor.create();

        const deviceType = getDeviceType(req);
        const ip = getRequestIp(req);

        req.actor.setDevice({ ip, type: deviceType });
        req.actor.setHeaderLang(req);

        next();
    }
}
