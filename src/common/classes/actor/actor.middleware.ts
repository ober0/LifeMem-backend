import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Actor } from './actor';
import { getDeviceType } from '../../helpers/get-device-type';
import { getRequestIp } from '../../helpers/get-ip';

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
