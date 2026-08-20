import { Injectable } from '@nestjs/common';
import type { UserSettings } from '@prisma/client';

import type { UserSettingsDto } from '../../common/types/user';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserSettingsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByUserId(userId: string): Promise<UserSettings | null> {
        return this.prisma.userSettings.findUnique({
            where: {
                userId
            }
        });
    }

    async upsert(userId: string, json: UserSettingsDto): Promise<UserSettings> {
        return this.prisma.userSettings.upsert({
            where: {
                userId
            },
            create: {
                userId,
                json: JSON.parse(JSON.stringify(json))
            },
            update: {
                json: JSON.parse(JSON.stringify(json))
            }
        });
    }
}
