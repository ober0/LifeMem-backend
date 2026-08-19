import { Injectable } from '@nestjs/common';
import type { ConfirmCodeType } from '@prisma/client';

import { appConstants } from '../../../common/config/app.constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { SaveTokenDto } from '../dto/tokens.dto';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async saveToken(payload: SaveTokenDto) {
        return this.prisma.refreshToken.create({
            data: {
                user: { connect: { id: payload.userId } },
                token: payload.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                ip: payload.ip
            }
        });
    }

    async findTokenByToken(refreshToken: string) {
        return this.prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                expiresAt: { gt: new Date() }
            }
        });
    }

    async deleteToken(tokenId: string) {
        return this.prisma.refreshToken.delete({
            where: { id: tokenId }
        });
    }

    async findUserToken(userId: string) {
        return this.prisma.refreshToken.findFirst({
            where: { userId }
        });
    }

    /** Находит валидный код и сразу удаляет все коды этого типа у пользователя. */
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
}
