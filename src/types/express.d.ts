import { JwtPayload } from 'jsonwebtoken';

import type { Actor } from '../common/classes/actor';
import type { ServerSettings } from '../common/classes/server-settings';

/**
 * Дополняет Express.Request (open interface для merging).
 * В коде типизируй через `import { Request } from 'express'`,
 * а не `Express.Request` — иначе будут видны только эти поля.
 */
declare global {
    namespace Express {
        interface Request {
            actor: Actor;
            serverSettings: ServerSettings;
            decodedToken: JwtPayload | string | null;
        }
    }
}

export {};
