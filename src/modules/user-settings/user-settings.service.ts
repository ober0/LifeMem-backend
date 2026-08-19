import { Injectable } from '@nestjs/common';

import { BASE_USER_SETTINGS } from '../../common/config/base-user-settings.const';
import type { UserSettingsDto } from '../../common/types/user';
import type { UserSettingsUpdateDto } from './dto/user-settings.dto';
import type { UserSettingsRepository } from './user-settings.repository';

@Injectable()
export class UserSettingsService {
    constructor(private readonly repository: UserSettingsRepository) {}

    async get(userId: string): Promise<UserSettingsDto> {
        const settings = await this.repository.findByUserId(userId);

        return {
            ...BASE_USER_SETTINGS,
            ...(settings?.json ? (settings.json as Record<string, unknown>) : {})
        };
    }

    async update(userId: string, dto: UserSettingsUpdateDto): Promise<UserSettingsDto> {
        const current = await this.get(userId);

        const updateData = {
            ...BASE_USER_SETTINGS,
            ...current,
            ...dto
        };

        const settings = await this.repository.upsert(userId, updateData);
        return settings.json as unknown as UserSettingsDto;
    }
}
