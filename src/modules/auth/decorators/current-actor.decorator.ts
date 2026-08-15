import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Actor } from '../../../common/classes/actor';

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor => {
    return ctx.switchToHttp().getRequest<Request>().actor;
});
