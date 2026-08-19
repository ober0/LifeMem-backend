import type { Request } from 'express';

import { DeviceType } from '../types/user';

export function getDeviceType(req: Request): DeviceType {
    const clientType = req.headers['x-client-type'] as string | undefined;

    if (clientType === 'mobile') {
        return DeviceType.MOBILE;
    }

    return DeviceType.WEB;
}
