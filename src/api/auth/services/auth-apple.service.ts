import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';

import type { Actor } from '../../../common/classes/actor';
import type { ServerSettings } from '../../../common/classes/server-settings';
import { apiError } from '../../../common/helpers/errors';
import { resolveAuthCountry } from '../../../common/helpers/get-country-from-request';
import type { UserDto } from '../../../common/types/user';
import { AppleApiService } from '../../apple-api/apple-api.service';
import { UserService } from '../../user/user.service';
import type { AppleAuthDto, AppleLinkAuthDto } from '../dto/apple-auth.dto';
import type { LoginResponseDto } from '../dto/tokens.dto';
import { AuthRepository } from '../repo/auth.repository';
import { UserOAuthRepository } from '../repo/user-oauth.repository';
import { AuthService } from './auth.service';

@Injectable()
export class AuthAppleService {
    constructor(
        private readonly authService: AuthService,
        private readonly authRepository: AuthRepository,
        private readonly userOAuthRepository: UserOAuthRepository,
        private readonly userService: UserService,
        private readonly appleApiService: AppleApiService
    ) {}

    async login(
        dto: AppleAuthDto,
        ip: string,
        serverSettings: ServerSettings,
        actor: Actor
    ): Promise<LoginResponseDto & { refreshToken: string }> {
        const appleData = await this.appleApiService.verifyIdToken(dto.idToken);
        const email = appleData.email;

        const oauthProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Apple, appleData.sub);

        if (oauthProvider) {
            serverSettings.assertAuthAllowed('apple', 'login', resolveAuthCountry(undefined, actor.requestCountry));

            const user = await this.userService.findOneById(oauthProvider.userId);
            return this.issueTokensAndSave(user, ip);
        }

        serverSettings.assertAuthAllowed('apple', 'register', resolveAuthCountry(undefined, actor.requestCountry));

        if (!dto.initSettings) {
            throw apiError.badRequest('auth.no_init_settings');
        }

        if (!email) {
            throw apiError.badRequest('auth.apple_email_not_found');
        }

        if (appleData.email && !appleData.emailVerified) {
            throw apiError.unauthorized('auth.apple_email_not_verified');
        }

        const nickname = dto.nickname;

        const user = await this.userService.createUserWithOAuthProvider(
            {
                nickname,
                provider: OAuthProvider.Apple,
                providerUserId: appleData.sub,
                providerEmail: email,
                providerUsername: appleData.name ?? nickname
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

    async link(dto: AppleLinkAuthDto, actor: Actor, serverSettings: ServerSettings): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw apiError.badRequest('auth.unauthorized');
        }

        serverSettings.assertAuthAllowed('apple', 'login', resolveAuthCountry(undefined, actor.requestCountry));

        const appleData = await this.appleApiService.verifyIdToken(dto.idToken);

        if (appleData.email && !appleData.emailVerified) {
            throw apiError.unauthorized('auth.apple_email_not_verified');
        }

        const existingProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Apple, appleData.sub);

        if (existingProvider) {
            if (existingProvider.userId === user.id) {
                throw apiError.badRequest('auth.apple_account_already_linked');
            } else {
                throw apiError.badRequest('auth.apple_account_linked_to_other');
            }
        }

        await this.userOAuthRepository.create(
            {
                provider: OAuthProvider.Apple,
                providerUserId: appleData.sub,
                providerEmail: appleData.email,
                providerUsername: appleData.name
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
        await this.userOAuthRepository.deleteByUserAndProvider(user.id, OAuthProvider.Apple);
    }
}
