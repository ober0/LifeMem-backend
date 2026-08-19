import type { Request } from 'express';

export function getRequestIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
        const headerValues = Array.isArray(forwardedFor) ? forwardedFor : forwardedFor.split(',');
        for (const value of headerValues) {
            const trimmed = value.trim();
            if (trimmed) {
                return trimmed;
            }
        }
    }

    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp) {
        return realIp;
    }

    if (request.ip) {
        return request.ip;
    }

    return request.socket?.remoteAddress ?? '';
}
