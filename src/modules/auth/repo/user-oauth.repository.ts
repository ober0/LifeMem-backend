import { Injectable } from '@nestjs/common';
import type { OAuthProvider } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import type { OauthCreateUser } from '../../user/dto/create-user.dto';

@Injectable()
export class UserOAuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByProvider(provider: OAuthProvider, providerUserId: string) {
        return this.prisma.userOAuthProvider.findFirst({
            where: {
                provider,
                providerUserId
            }
        });
    }

    async create(data: Omit<OauthCreateUser, 'nickname'>, userId: string) {
        return this.prisma.userOAuthProvider.create({
            data: {
                userId,
                provider: data.provider,
                providerEmail: data.providerEmail,
                providerUserId: data.providerUserId,
                providerUsername: data.providerUsername,
                providerAvatarUrl: data.providerAvatarUrl
            }
        });
    }

    async countByUserId(userId: string): Promise<number> {
        return this.prisma.userOAuthProvider.count({
            where: { userId }
        });
    }

    async deleteByUserAndProvider(userId: string, provider: OAuthProvider): Promise<void> {
        await this.prisma.userOAuthProvider.delete({
            where: {
                userId_provider: { userId, provider }
            }
        });
    }
}
