import { Injectable } from '@nestjs/common';

import { BASE_SERVICE_SETTINGS } from '../../common/config/base-service-settings.const';
import { apiError } from '../../common/helpers/errors';
import type { ServiceSettingsDto } from './dto/base.dto';
import type { ServiceSettingsJsonDto } from './dto/settings-json.dto';
import type { ServiceSettingsUpdateDto } from './dto/update.dto';
import type { ServiceSettingsRepository } from './service-settings.repository';

@Injectable()
export class ServiceSettingsService {
    constructor(private readonly repository: ServiceSettingsRepository) {}

    async getJsonForRequest(): Promise<ServiceSettingsJsonDto> {
        const data = await this.repository.findByServiceUuid();
        return (data?.json as unknown as ServiceSettingsJsonDto | null) ?? { ...BASE_SERVICE_SETTINGS };
    }

    async getServiceSettings(): Promise<ServiceSettingsDto> {
        const data = await this.repository.findByServiceUuid();
        if (!data) {
            throw apiError.notFound('service_settings.not_found');
        }
        return data as unknown as ServiceSettingsDto;
    }

    async updateServiceSettings(dto: ServiceSettingsUpdateDto): Promise<ServiceSettingsJsonDto> {
        const current = await this.repository.findByServiceUuid();

        if (!current) {
            const created = await this.repository.upsert({
                ...BASE_SERVICE_SETTINGS,
                ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined))
            });
            return created.json as unknown as ServiceSettingsJsonDto;
        }

        const currentJson = current.json as unknown as ServiceSettingsJsonDto;

        const merged: ServiceSettingsJsonDto = {
            ...currentJson,
            ...Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined))
        };

        const updated = await this.repository.upsert(merged);
        return updated.json as unknown as ServiceSettingsJsonDto;
    }
}
