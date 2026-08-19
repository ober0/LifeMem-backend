import { registerAs } from '@nestjs/config';

export type OauthConfig = {
    googleClientId: string;
    appleClientId: string;
};

export default registerAs(
    'oauth',
    (): OauthConfig => ({
        googleClientId: process.env.GOOGLE_CLIENT_ID || 'test',
        appleClientId: process.env.APPLE_CLIENT_ID || 'test'
    })
);
