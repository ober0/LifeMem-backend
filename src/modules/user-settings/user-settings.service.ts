import { Injectable } from '@nestjs/common';
import { BASE_USER_SETTINGS } from '../../common/config/base-user-settings.const';
import { UserSettingsDto } from '../../common/types/user';
import { UserSettingsRepository } from './user-settings.repository';

@Injectable()
export class UserSettingsService {
    constructor(private readonly repository: UserSettingsRepository) {}

    async get(userId: string): Promise<UserSettingsDto> {
        const settings = await this.repository.findByUserId(userId);

        return (settings?.json as unknown as UserSettingsDto) ?? { ...BASE_USER_SETTINGS };
    }

    async update(userId: string, dto: UserSettingsDto): Promise<UserSettingsDto> {
        const settings = await this.repository.upsert(userId, dto);
        return settings.json as unknown as UserSettingsDto;
    }
}
