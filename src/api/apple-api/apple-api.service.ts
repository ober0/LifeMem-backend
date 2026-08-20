import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';

import type { OauthConfig} from '../../common/config/env';
import { oauthConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';

export type AppleTokenPayload = {
    sub: string;
    email?: string;
    emailVerified: boolean;
    name?: string;
};

@Injectable()
export class AppleApiService implements OnModuleInit {
    private clientId!: string;

    constructor(@Inject(oauthConfig.KEY) private readonly oauth: OauthConfig) {}

    onModuleInit() {
        this.clientId = this.oauth.appleClientId;
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
