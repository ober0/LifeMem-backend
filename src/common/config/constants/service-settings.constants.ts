import type { ServiceSettingsJsonDto } from '../../../api/service-settings/dto/settings-json.dto';
import { AiProvider } from '../../types/ai/ai-provider.enum';

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
        },
        models: {
            analyze: {
                premium: null,
                lite: null
            },
            embedding: {
                premium: null,
                lite: null
            },
            vision: {
                premium: null,
                lite: null
            },
            provider: AiProvider.Polza
        }
    } satisfies ServiceSettingsJsonDto
} as const;
