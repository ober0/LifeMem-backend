import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import type { ServerSettings } from '../../../common/classes/server-settings';

export const CurrentServerSettings = createParamDecorator((_data: unknown, ctx: ExecutionContext): ServerSettings => {
    return ctx.switchToHttp().getRequest<Request>().serverSettings;
});
