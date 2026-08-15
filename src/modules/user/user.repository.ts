import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { authUserInclude, AuthUserRecord } from './consts/user.constants';

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

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
