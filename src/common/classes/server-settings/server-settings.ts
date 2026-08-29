import type { CountryCode } from 'libphonenumber-js';

import type { AuthMethodKey, ServiceSettingsJsonDto } from '../../../api/service-settings/dto/settings-json.dto';
import { appConstants } from '../../config/app.constants';
import { apiError } from '../../helpers/errors';

export type AuthAction = 'login' | 'register';

export class ServerSettings {
    private _json: ServiceSettingsJsonDto;

    private constructor(json: ServiceSettingsJsonDto) {
        this._json = { ...json };
    }

    static create(json?: ServiceSettingsJsonDto | null): ServerSettings {
        return new ServerSettings(json ?? { ...appConstants.serviceSettings.base });
    }

    get json(): Readonly<ServiceSettingsJsonDto> {
        return this._json;
    }

    get appVersion(): number {
        return this._json.appVersion;
    }

    setJson(json: ServiceSettingsJsonDto): void {
        this._json = { ...json };
    }

    assertAuthAllowed(method: AuthMethodKey, action: AuthAction, country: CountryCode | null): void {
        const methodSettings = this._json.authMethods[method];
        const isEnabled = action === 'login' ? methodSettings.isLoginEnabled : methodSettings.isRegistrationEnabled;

        if (!isEnabled) {
            throw apiError.forbidden('auth.auth_method_disabled');
        }

        if (methodSettings.allowAllCountry) {
            return;
        }

        if (!country || !methodSettings.countriesWhitelist.includes(country)) {
            throw apiError.forbidden('auth.country_not_allowed');
        }
    }
}
