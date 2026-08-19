declare module 'express-basic-auth' {
    import type { RequestHandler } from 'express';

    interface BasicAuthOptions {
        users: Record<string, string>;
        challenge?: boolean;
        realm?: string;
    }

    function basicAuth(options: BasicAuthOptions): RequestHandler;

    export default basicAuth;
}
