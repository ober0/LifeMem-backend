import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { Actor } from './actor';

@Injectable()
export class ActorMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void {
        req.actor = Actor.create();
        next();
    }
}
