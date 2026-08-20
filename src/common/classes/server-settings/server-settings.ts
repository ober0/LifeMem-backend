import type { ServiceSettingsJsonDto } from '../../../api/service-settings/dto/settings-json.dto';
import { appConstants } from '../../config/app.constants';

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
}
