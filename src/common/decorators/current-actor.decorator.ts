import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { Actor } from '../classes/actor';

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor => {
    return ctx.switchToHttp().getRequest<Request>().actor;
});
