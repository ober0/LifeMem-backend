import { BASE_SERVICE_SETTINGS } from '../config/base-service-settings.const';
import { ServiceSettingsJsonDto } from '../../modules/service-settings/dto/settings-json.dto';

export class ServerSettings {
    private _json: ServiceSettingsJsonDto;

    private constructor(json: ServiceSettingsJsonDto) {
        this._json = { ...json };
    }

    static create(json?: ServiceSettingsJsonDto | null): ServerSettings {
        return new ServerSettings(json ?? { ...BASE_SERVICE_SETTINGS });
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
