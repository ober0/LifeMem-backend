import { Injectable } from '@nestjs/common';
import type { ConfirmCodeType, Prisma, User } from '@prisma/client';

import { appConstants } from '../../common/config/app.constants';
import { mapPagination } from '../../common/helpers/map.pagination';
import { mapSearch } from '../../common/helpers/map.search';
import { mapSort } from '../../common/helpers/map.sort';
import { SortTypes } from '../../common/types/search/sort-types.dto';
import type { UserSettingsDto } from '../../common/types/user';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserRecord } from './consts/user.constants';
import { authUserInclude } from './consts/user.constants';
import type { UserAdminSearchDto } from './dto/admin-search.dto';
import { UserAdminFilterDto } from './dto/admin-search.dto';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
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

    async updateNickname(userId: string, nickname: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { nickname }
        });
    }

    async setPhoneNumber(userId: string, phoneNumber: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                phoneNumber,
                isPhoneVerified: false
            }
        });
    }

    async setEmailWithPassword(userId: string, email: string, passwordHash: string) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
                return null;
            }

            if (user.passwordId) {
                await tx.password.update({
                    where: { id: user.passwordId },
                    data: { password: passwordHash }
                });

                return tx.user.update({
                    where: { id: userId },
                    data: {
                        email,
                        isEmailVerified: false
                    }
                });
            }

            return tx.user.update({
                where: { id: userId },
                data: {
                    email,
                    isEmailVerified: false,
                    password: {
                        create: {
                            password: passwordHash
                        }
                    }
                }
            });
        });
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

    private buildAdminWhere(dto: UserAdminSearchDto): Prisma.UserWhereInput {
        return mapSearch(dto.filters, [], [], dto.query, ['nickname', 'email', 'phoneNumber'], UserAdminFilterDto);
    }

    async adminSearch(dto: UserAdminSearchDto) {
        return this.prisma.user.findMany({
            where: this.buildAdminWhere(dto),
            orderBy: mapSort(dto.sorts ?? { createdAt: SortTypes.DESC }),
            ...mapPagination(dto.pagination)
        });
    }

    async adminCount(dto: UserAdminSearchDto): Promise<number> {
        return this.prisma.user.count({
            where: this.buildAdminWhere(dto)
        });
    }

    async adminUpdate(userId: string, data: AdminUpdateUserDto) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.nickname && { nickname: data.nickname }),
                ...(data.email && { email: data.email }),
                ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
                ...(data.isEmailVerified && { isEmailVerified: data.isEmailVerified }),
                ...(data.isPhoneVerified && { isPhoneVerified: data.isPhoneVerified }),
                ...(data.roleId && { role: { connect: { id: data.roleId } } })
            }
        });
    }

    async adminDelete(userId: string) {
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) {
                return null;
            }

            await tx.user.delete({ where: { id: userId } });

            if (user.passwordId) {
                await tx.password.delete({ where: { id: user.passwordId } });
            }

            return user;
        });
    }
}
