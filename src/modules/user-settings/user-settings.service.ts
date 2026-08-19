import { Injectable } from '@nestjs/common';

import { appConstants } from '../../common/config/app.constants';
import type { UserSettingsDto } from '../../common/types/user';
import type { UserSettingsUpdateDto } from './dto/user-settings.dto';
import type { UserSettingsRepository } from './user-settings.repository';

@Injectable()
export class UserSettingsService {
    constructor(private readonly repository: UserSettingsRepository) {}

    async get(userId: string): Promise<UserSettingsDto> {
        const settings = await this.repository.findByUserId(userId);

        return {
            ...appConstants.userSettings.base,
            ...(settings?.json ? (settings.json as Record<string, unknown>) : {})
        };
    }

    async update(userId: string, dto: UserSettingsUpdateDto): Promise<UserSettingsDto> {
        const current = await this.get(userId);

        const updateData = {
            ...appConstants.userSettings.base,
            ...current,
            ...dto
        };

        const settings = await this.repository.upsert(userId, updateData);
        return settings.json as unknown as UserSettingsDto;
    }
}
