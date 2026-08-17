import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { Actor } from '../../../common/classes/actor';
import { apiError } from '../../../common/errors';
import { UserDto } from '../../../common/types/user';
import { GoogleApiService } from '../../google-api/google-api.service';
import { UserService } from '../../user/user.service';
import { GoogleAuthDto, GoogleLinkDto } from '../dto/google-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthRepository } from '../repo/auth.repository';
import { UserOAuthRepository } from '../repo/user-oauth.repository';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGoogleService {
    constructor(
        private readonly authService: AuthService,
        private readonly authRepository: AuthRepository,
        private readonly userOAuthRepository: UserOAuthRepository,
        private readonly userService: UserService,
        private readonly googleApiService: GoogleApiService
    ) {}

    async login(dto: GoogleAuthDto, ip: string): Promise<LoginResponseDto & { refreshToken: string }> {
        const googleData = await this.googleApiService.verifyIdToken(dto.idToken);

        if (!googleData.email) {
            throw apiError.badRequest('error.auth.google_email_not_found');
        }

        if (!googleData.emailVerified) {
            throw apiError.unauthorized('error.auth.google_email_not_verified');
        }

        const oauthProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Google, googleData.sub);

        if (oauthProvider) {
            const user = await this.userService.findOneById(oauthProvider.userId);
            return this.issueTokensAndSave(user, ip);
        }

        if (!dto.initSettings) {
            throw apiError.badRequest('error.auth.no_init_settings');
        }

        const user = await this.userService.createUserWithOAuthProvider(
            {
                nickname: dto.nickname,
                provider: OAuthProvider.Google,
                providerUserId: googleData.sub,
                providerEmail: googleData.email,
                providerUsername: googleData.name,
                providerAvatarUrl: googleData.picture
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

    async link(dto: GoogleLinkDto, actor: Actor): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw apiError.badRequest('error.auth.unauthorized');
        }

        const googleData = await this.googleApiService.verifyIdToken(dto.idToken);

        if (!googleData.email) {
            throw apiError.badRequest('error.auth.google_email_not_found');
        }

        if (!googleData.emailVerified) {
            throw apiError.unauthorized('error.auth.google_email_not_verified');
        }

        const existingProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Google, googleData.sub);

        if (existingProvider) {
            if (existingProvider.userId === user.id) {
                throw apiError.badRequest('error.auth.google_account_already_linked');
            } else {
                throw apiError.badRequest('error.auth.google_account_linked_to_other');
            }
        }

        await this.userOAuthRepository.create(
            {
                provider: OAuthProvider.Google,
                providerUserId: googleData.sub,
                providerEmail: googleData.email,
                providerUsername: googleData.name,
                providerAvatarUrl: googleData.picture
            },
            user.id
        );
    }

    async unlink(actor: Actor): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw apiError.badRequest('error.auth.unauthorized');
        }

        const providersCount = await this.userOAuthRepository.countByUserId(user.id);
        if (providersCount <= 1 && !user.passwordId) {
            throw apiError.badRequest('error.auth.cannot_unlink_only_auth');
        }
        await this.userOAuthRepository.deleteByUserAndProvider(user.id, OAuthProvider.Google);
    }
}
