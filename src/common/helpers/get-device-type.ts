import { Request } from 'express';

export type DeviceType = 'desktop' | 'mobile';

export function getDeviceType(req: Request): DeviceType {
    const clientType = req.headers['x-client-type'] as string | undefined;

    if (clientType === 'mobile') {
        return 'mobile';
    }
    return 'desktop';
}
