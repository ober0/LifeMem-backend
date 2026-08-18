import { Injectable, OnModuleInit } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';
import { apiError } from '../../common/errors';

export type AppleTokenPayload = {
    sub: string;
    email?: string;
    emailVerified: boolean;
    name?: string;
};

@Injectable()
export class AppleApiService implements OnModuleInit {
    private clientId!: string;

    onModuleInit() {
        // FIXME
        const clientId = process.env.APPLE_CLIENT_ID || 'test';
        if (!clientId) {
            throw new Error('Не указан APPLE_CLIENT_ID');
        }
        this.clientId = clientId;
    }

    async verifyIdToken(idToken: string): Promise<AppleTokenPayload> {
        try {
            const payload = (await appleSignin.verifyIdToken(idToken, {
                audience: this.clientId,
                ignoreExpiration: false
            })) as {
                sub: string;
                email?: string;
                email_verified?: boolean | 'true' | 'false';
                name?: string;
            };

            return {
                sub: payload.sub,
                email: payload.email ?? undefined,
                emailVerified: payload.email_verified === true || payload.email_verified === 'true',
                name: payload.name ?? undefined
            };
        } catch {
            throw apiError.unauthorized('auth.apple_token_invalid');
        }
    }
}
