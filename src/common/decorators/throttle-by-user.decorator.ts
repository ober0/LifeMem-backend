import { Throttle } from '@nestjs/throttler';

import { appConstants } from '../config/app.constants';
import { THROTTLER_NAME_IP, THROTTLER_NAME_USER } from '../guards/app-throttler.guard';

export function ThrottleByUser({ limit, ttlMs }: { limit?: number; ttlMs?: number }): MethodDecorator & ClassDecorator {
    return Throttle({
        [THROTTLER_NAME_USER]: {
            limit: limit ?? appConstants.throttle.user.limit,
            ttl: ttlMs ?? appConstants.throttle.user.ttlMs
        }
    });
}

export function ThrottleByIp({ limit, ttlMs }: { limit?: number; ttlMs?: number }): MethodDecorator & ClassDecorator {
    return Throttle({
        [THROTTLER_NAME_IP]: {
            limit: limit ?? appConstants.throttle.ip.limit,
            ttl: ttlMs ?? appConstants.throttle.ip.ttlMs
        }
    });
}
