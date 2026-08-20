import type { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { apiError } from '../helpers/errors';
import { getDeviceType } from '../helpers/get-device-type';
import { getRequestIp } from '../helpers/get-ip';
import { DeviceType } from '../types/user';

export const THROTTLER_NAME_IP = 'ip';
export const THROTTLER_NAME_USER = 'user';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
    protected async throwThrottlingException(): Promise<void> {
        throw apiError.tooManyRequests('common.too_many_requests');
    }
}

export function getIpTracker(req: Request): string {
    return `ip:${getRequestIp(req)}`;
}

export function getUserTracker(req: Request): string {
    const userId = resolveUserId(req);
    if (!userId) {
        return getIpTracker(req);
    }
    return `user:${userId}`;
}

export function shouldSkipIpThrottler(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    return Boolean(resolveUserId(req));
}

export function shouldSkipUserThrottler(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    return !resolveUserId(req);
}

function resolveUserId(req: Request): string | null {
    if (req.actor?.user?.id) {
        return req.actor.user.id;
    }

    const token = tryGetAccessToken(req);
    if (!token) {
        return null;
    }

    const payload = jwt.decode(token);
    req.decodedToken = payload;

    if (!payload || typeof payload === 'string' || typeof payload.id !== 'string') {
        return null;
    }

    return payload.id;
}

function tryGetAccessToken(req: Request): string | null {
    if (getDeviceType(req) === DeviceType.MOBILE) {
        const header = req.headers?.authorization;
        if (!header) {
            return null;
        }
        const parts = header.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
            return null;
        }
        return parts[1];
    }

    const cookieToken = req.cookies?.accessToken;
    return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : null;
}
