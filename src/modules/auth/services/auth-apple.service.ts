import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuthProvider } from '@prisma/client';
import { UserDto } from '../../../common/types/user';
import { AppleApiService } from '../../apple-api/apple-api.service';
import { UserService } from '../../user/user.service';
import { AppleAuthDto, AppleLinkAuthDto } from '../dto/apple-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthRepository } from '../repo/auth.repository';
import { UserOAuthRepository } from '../repo/user-oauth.repository';
import { AuthService } from './auth.service';
import { Actor } from '../../../common/classes/actor';

@Injectable()
export class AuthAppleService {
    constructor(
        private readonly authService: AuthService,
        private readonly authRepository: AuthRepository,
        private readonly userOAuthRepository: UserOAuthRepository,
        private readonly userService: UserService,
        private readonly appleApiService: AppleApiService
    ) {}

    async login(dto: AppleAuthDto, ip: string): Promise<LoginResponseDto & { refreshToken: string }> {
        const appleData = await this.appleApiService.verifyIdToken(dto.idToken);
        const email = appleData.email;

        const oauthProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Apple, appleData.sub);

        if (oauthProvider) {
            const user = await this.userService.findOneById(oauthProvider.userId);
            return this.issueTokensAndSave(user, ip);
        }

        if (!email) {
            throw new BadRequestException('error.auth.apple_email_not_found');
        }

        if (appleData.email && !appleData.emailVerified) {
            throw new UnauthorizedException('error.auth.apple_email_not_verified');
        }

        const nickname = dto.nickname;

        const user = await this.userService.createUserWithOAuthProvider({
            nickname,
            provider: OAuthProvider.Apple,
            providerUserId: appleData.sub,
            providerEmail: email,
            providerUsername: appleData.name ?? nickname
        });

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

    async link(dto: AppleLinkAuthDto, actor: Actor): Promise<void> {
        const user = actor.user;
        if (!user) {
            throw new BadRequestException('error.auth.unauthorized');
        }

        const appleData = await this.appleApiService.verifyIdToken(dto.idToken);

        if (appleData.email && !appleData.emailVerified) {
            throw new UnauthorizedException('error.auth.apple_email_not_verified');
        }

        const existingProvider = await this.userOAuthRepository.findByProvider(OAuthProvider.Apple, appleData.sub);

        if (existingProvider) {
            if (existingProvider.userId === user.id) {
                throw new BadRequestException('error.auth.apple_account_already_linked');
            } else {
                throw new BadRequestException('error.auth.apple_account_linked_to_other');
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
            throw new BadRequestException('error.auth.unauthorized');
        }

        const providersCount = await this.userOAuthRepository.countByUserId(user.id);
        if (providersCount <= 1 && !user.passwordId) {
            throw new BadRequestException('error.auth.cannot_unlink_only_auth');
        }
        await this.userOAuthRepository.deleteByUserAndProvider(user.id, OAuthProvider.Apple);
    }
}
