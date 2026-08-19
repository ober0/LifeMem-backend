import type { ServiceSettingsJsonDto } from '../../../modules/service-settings/dto/settings-json.dto';

export const serviceSettingsConstants = {
    base: {
        appVersion: 1
    } satisfies ServiceSettingsJsonDto
} as const;
