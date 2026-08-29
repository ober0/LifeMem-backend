import type { ServiceSettingsJsonDto } from '../../../api/service-settings/dto/settings-json.dto';

export const serviceSettingsConstants = {
    base: {
        appVersion: 1,
        authMethods: {
            email: {
                isRegistrationEnabled: true,
                isLoginEnabled: true,
                allowAllCountry: true,
                countriesWhitelist: []
            },
            freshCall: {
                isRegistrationEnabled: false,
                isLoginEnabled: false,
                allowAllCountry: false,
                countriesWhitelist: []
            },
            telegram: {
                isRegistrationEnabled: true,
                isLoginEnabled: true,
                allowAllCountry: true,
                countriesWhitelist: []
            },
            google: {
                isRegistrationEnabled: true,
                isLoginEnabled: true,
                allowAllCountry: true,
                countriesWhitelist: []
            },
            apple: {
                isRegistrationEnabled: false,
                isLoginEnabled: false,
                allowAllCountry: true,
                countriesWhitelist: []
            }
        }
    } satisfies ServiceSettingsJsonDto
} as const;
