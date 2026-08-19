import type { OnModuleInit} from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import type { OauthConfig} from '../../common/config/env';
import { oauthConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';

export type GoogleTokenPayload = {
    sub: string;
    email?: string;
    emailVerified?: boolean;
    name?: string;
    picture?: string;
};

@Injectable()
export class GoogleApiService implements OnModuleInit {
    private client!: OAuth2Client;
    private clientId!: string;

    constructor(@Inject(oauthConfig.KEY) private readonly oauth: OauthConfig) {}

    onModuleInit() {
        this.clientId = this.oauth.googleClientId;
        this.client = new OAuth2Client(this.clientId);
    }

    async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.clientId
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw apiError.unauthorized('auth.google_token_payload_error');
            }

            return {
                sub: payload.sub!,
                email: payload.email ?? undefined,
                emailVerified: payload.email_verified ?? undefined,
                name: payload.name ?? undefined,
                picture: payload.picture ?? undefined
            };
        } catch (err) {
            if (err instanceof UnauthorizedException) {
                throw err;
            }
            throw apiError.unauthorized('auth.google_token_invalid');
        }
    }
}
