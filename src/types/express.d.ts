import type { Actor } from '../common/actor/actor';
import type { ServerSettings } from '../common/server-settings/server-settings';

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
        }
    }
}

export {};
