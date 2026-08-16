import { Request } from 'express';
import { DeviceType } from '../types/user';

export function getDeviceType(request: Request): 'web' | 'mobile' {
    const type = request.actor?.device?.type;
    if (type === DeviceType.MOBILE) {
        return 'mobile';
    }
    return 'web';
}
