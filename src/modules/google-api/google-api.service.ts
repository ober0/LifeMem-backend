import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

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

    onModuleInit() {
        // FIXME
        const googleClientId = process.env.GOOGLE_CLIENT_ID || 'test';
        if (!googleClientId) {
            throw new Error('Не указан GOOGLE_CLIENT_ID');
        }
        this.clientId = googleClientId;
        this.client = new OAuth2Client(googleClientId);
    }

    async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.clientId
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('error.auth.google_token_payload_error');
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
            throw new UnauthorizedException('error.auth.google_token_invalid');
        }
    }
}
