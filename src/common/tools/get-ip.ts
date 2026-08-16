import { Request } from 'express';

export function getRequestIp(request: Request): string {
    return request.actor?.device?.ip ?? request.ip ?? '0.0.0.0';
}
