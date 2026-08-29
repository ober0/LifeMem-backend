import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

import { appConstants } from '../../common/config/app.constants';
import type { TelegramConfig } from '../../common/config/env';
import { telegramConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';

export type TelegramLoginPayload = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
};

export type TelegramVerifiedUser = {
    id: string;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
};

@Injectable()
export class TelegramApiService implements OnModuleInit {
    private botToken!: string;

    constructor(@Inject(telegramConfig.KEY) private readonly telegram: TelegramConfig) {}

    onModuleInit() {
        this.botToken = this.telegram.botToken;
    }

    verifyLoginData(payload: TelegramLoginPayload): TelegramVerifiedUser {
        if (!this.botToken) {
            throw apiError.serviceUnavailable('auth.telegram_oauth_not_configured');
        }

        const now = Math.floor(Date.now() / 1000);
        if (now - payload.auth_date > appConstants.telegram.authMaxAgeSec) {
            throw apiError.unauthorized('auth.telegram_auth_expired');
        }

        if (!this.isValidHash(payload)) {
            throw apiError.unauthorized('auth.telegram_hash_invalid');
        }

        return {
            id: String(payload.id),
            firstName: payload.first_name,
            lastName: payload.last_name,
            username: payload.username,
            photoUrl: payload.photo_url
        };
    }

    private isValidHash(payload: TelegramLoginPayload): boolean {
        const { hash, ...fields } = payload;
        const checkString = Object.entries(fields)
            .filter(([, value]) => value !== undefined && value !== null)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const secretKey = createHash('sha256').update(this.botToken).digest();
        const computed = createHmac('sha256', secretKey).update(checkString).digest('hex');

        try {
            return timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
        } catch {
            return false;
        }
    }
}
