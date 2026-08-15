import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserSettingsDto } from '../../common/types/user';
import { PrismaService } from '../prisma/prisma.service';
import { authUserInclude, AuthUserRecord } from './consts/user.constants';

export type CreateUserData = {
    nickname: string;
    email?: string;
    phoneNumber: string | null;
    roleId: string;
    passwordHash: string;
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
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: {
                    connect: { id: data.roleId }
                },
                password: {
                    create: {
                        password: data.passwordHash
                    }
                },
                userSettings: {
                    create: {
                        json: JSON.parse(JSON.stringify(data.settings))
                    }
                }
            }
        });
    }

    async findAuthUserByToken(token: string): Promise<AuthUserRecord | null> {
        const refreshToken = await this.prisma.refreshToken.findUnique({
            where: { token },
            include: {
                user: {
                    include: authUserInclude
                }
            }
        });

        if (!refreshToken || refreshToken.expiresAt <= new Date()) {
            return null;
        }

        return refreshToken.user;
    }
}
