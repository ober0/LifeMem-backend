import { Injectable } from '@nestjs/common';
import type { ConfirmCodeType, User } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import type { UserSettingsDto } from '../../common/types/user';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUserRecord } from './consts/user.constants';
import { authUserInclude } from './consts/user.constants';
import type { OauthCreateUser } from './dto/create-user.dto';

export type CreateUserData = {
    nickname: string;
    email?: string | null;
    phoneNumber: string | null;
    roleId: string;
    passwordHash?: string;
    settings: UserSettingsDto;
};

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { phoneNumber } });
    }

    async create(data: CreateUserData): Promise<User> {
        return this.prisma.user.create({
            data: {
                nickname: data.nickname,
                email: data.email ?? null,
                phoneNumber: data.phoneNumber,
                role: {
                    connect: { id: data.roleId }
                },
                ...(data.passwordHash
                    ? {
                          password: {
                              create: {
                                  password: data.passwordHash
                              }
                          }
                      }
                    : {}),
                userSettings: {
                    create: {
                        json: JSON.parse(JSON.stringify(data.settings))
                    }
                }
            }
        });
    }

    async findAuthUserById(id: string): Promise<AuthUserRecord | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: authUserInclude
        });
    }

    async findByEmailWithPassword(email: string) {
        return this.prisma.user.findUnique({ where: { email }, include: { password: true } });
    }

    async findByPhone(phone: string) {
        return this.prisma.user.findUnique({ where: { phoneNumber: phone } });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async markEmailVerified(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isEmailVerified: true }
        });
    }

    async markPhoneVerified(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { isPhoneVerified: true }
        });
    }

    async createConfirmationCode(data: { type: ConfirmCodeType; code: string | number; userId: string }) {
        const code = typeof data.code === 'string' ? Number(data.code) : data.code;

        return this.prisma.$transaction(async (tx) => {
            await tx.confirmCode.deleteMany({
                where: { userId: data.userId, type: data.type }
            });

            return tx.confirmCode.create({
                data: {
                    type: data.type,
                    code,
                    expiresAt: new Date(Date.now() + appConstants.code.mobileLifetimeMs),
                    user: {
                        connect: { id: data.userId }
                    }
                }
            });
        });
    }

    async consumeValidConfirmationCode(userId: string, type: ConfirmCodeType, code: number) {
        return this.prisma.$transaction(async (tx) => {
            const confirm = await tx.confirmCode.findFirst({
                where: {
                    userId,
                    type,
                    code,
                    expiresAt: { gt: new Date() }
                }
            });

            if (!confirm) {
                return null;
            }

            await tx.confirmCode.deleteMany({
                where: { userId, type }
            });

            return confirm;
        });
    }

    async createUserWithOAuthProvider(data: OauthCreateUser, roleId: string, settings: UserSettingsDto): Promise<User> {
        return this.prisma.user.create({
            data: {
                nickname: data.nickname,
                email: data.providerEmail ?? null,
                isEmailVerified: Boolean(data.providerEmail),
                role: {
                    connect: { id: roleId }
                },
                oauthProviders: {
                    create: {
                        provider: data.provider,
                        providerEmail: data.providerEmail,
                        providerUserId: data.providerUserId,
                        providerUsername: data.providerUsername,
                        providerAvatarUrl: data.providerAvatarUrl
                    }
                },
                userSettings: {
                    create: {
                        json: JSON.parse(JSON.stringify(settings))
                    }
                }
            }
        });
    }

    async findBindings(userId: string) {
        return this.prisma.userOAuthProvider.findMany({
            where: { userId },
            omit: {
                userId: true,
                id: true
            }
        });
    }
}
