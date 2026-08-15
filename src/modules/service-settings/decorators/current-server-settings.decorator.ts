import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ServerSettings } from '../../../common/classes/server-settings';

export const CurrentServerSettings = createParamDecorator((_data: unknown, ctx: ExecutionContext): ServerSettings => {
    return ctx.switchToHttp().getRequest<Request>().serverSettings;
});
