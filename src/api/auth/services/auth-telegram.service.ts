import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';

import type { Actor } from '../../../common/classes/actor';
import type { ServerSettings } from '../../../common/classes/server-settings';
import { apiError } from '../../../common/helpers/errors';
import { resolveAuthCountry } from '../../../common/helpers/get-country-from-request';
import { TelegramApiService } from '../../telegram-api/telegram-api.service';
import type { UserDto } from '../../user/dto/user.dto';
import { UserService } from '../../user/user.service';
import type { TelegramAuthDto, TelegramLinkDto } from '../dto/telegram-auth.dto';
import type { LoginResponseDto } from '../dto/tokens.dto';
import { AuthRepository } from '../repo/auth.repository';
import { UserOAuthRepository } from '../repo/user-oauth.repository';
import { AuthService } from './auth.service';

@Injectable()
export class AuthTelegramService {
    constructor(
        private readonly authService: AuthService,
        private readonly authRepository: AuthRepository,
        private readonly userOAuthRepository: UserOAuthRepository,
        private readonly userService: UserService,
        private readonly telegramApiService: TelegramApiService
    ) {}

    async login(
        dto: TelegramAuthDto,
        ip: string,
        serverSettings: ServerSettings,
        actor: Actor
    ): Promise<LoginResponseDto & { refreshToken: string }> {
        const telegramUser = this.telegramApiService.verifyLoginData(dto.telegramData);
        const country = resolveAuthCountry(undefined, actor.requestCountry);

        const oauthProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Telegram, telegramUser.id);

        if (oauthProvider) {
            serverSettings.assertAuthAllowed('telegram', 'login', country);

            const user = await this.userService.findOneById(oauthProvider.userId);
            return this.issueTokensAndSave(user, ip);
        }

        serverSettings.assertAuthAllowed('telegram', 'register', country);

        if (!dto.initSettings) {
            throw apiError.badRequest('auth.no_init_settings');
        }

        const providerUsername = telegramUser.username ?? telegramUser.firstName;

        const user = await this.userService.createUserWithOAuthProvider(
            {
                nickname: dto.nickname,
                provider: OAuthProvider.Telegram,
                providerUserId: telegramUser.id,
                providerUsername,
                providerAvatarUrl: telegramUser.photoUrl
            },
            dto.initSettings
        );

        return this.issueTokensAndSave(user, ip);
    }

    private async issueTokensAndSave(user: UserDto, ip: string): Promise<LoginResponseDto & { refreshToken: string }> {
        const { refreshToken, accessToken } = this.authService.generateTokens(user.id);

        const existing = await this.authRepository.findUserToken(user.id);
        if (existing?.id) {
            await this.authRepository.deleteToken(existing.id);
        }

        await this.authService.saveToken({ userId: user.id, refreshToken, ip });

        return { accessToken, refreshToken, user };
    }

    async link(dto: TelegramLinkDto, actor: Actor, serverSettings: ServerSettings): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw apiError.badRequest('auth.unauthorized');
        }

        serverSettings.assertAuthAllowed('telegram', 'login', resolveAuthCountry(undefined, actor.requestCountry));

        const telegramUser = this.telegramApiService.verifyLoginData(dto.telegramData);

        const existingProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Telegram, telegramUser.id);

        if (existingProvider) {
            if (existingProvider.userId === user.id) {
                throw apiError.badRequest('auth.telegram_account_already_linked');
            }
            throw apiError.badRequest('auth.telegram_account_linked_to_other');
        }

        const providerUsername = telegramUser.username ?? telegramUser.firstName;

        await this.userOAuthRepository.create(
            {
                provider: OAuthProvider.Telegram,
                providerUserId: telegramUser.id,
                providerUsername,
                providerAvatarUrl: telegramUser.photoUrl
            },
            user.id
        );
    }

    async unlink(actor: Actor): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw apiError.badRequest('auth.unauthorized');
        }

        const providersCount = await this.userOAuthRepository.countByUserId(user.id);
        if (providersCount <= 1 && !user.passwordId) {
            throw apiError.badRequest('auth.cannot_unlink_only_auth');
        }
        await this.userOAuthRepository.deleteByUserAndProvider(user.id, OAuthProvider.Telegram);
    }
}
