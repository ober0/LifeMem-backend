import type { Request } from 'express';
import type { CountryCode } from 'libphonenumber-js';

import type { UserDto } from '../../../api/user/dto/user.dto';
import type { UserSettingsDto } from '../../../api/user-settings/dto/user-settings.dto';
import { getCountryFromRequest } from '../../helpers/get-country-from-request';
import { getLanguageFromRequest } from '../../helpers/get-language';
import { LangEnum } from '../../types/common/lang.enum';
import type { DeviceDto } from '../../types/user';
import type { PermissionDto } from '../../types/user';

export class Actor {
    private _user: UserDto | null = null;
    private _permissions: PermissionDto[] = [];
    private _device: DeviceDto | null = null;
    private _settings: UserSettingsDto | null = null;
    private _headerLang: LangEnum = LangEnum.En;
    private _userLang: LangEnum;
    private _requestCountry: CountryCode | null = null;

    private constructor() {}

    static create(): Actor {
        return new Actor();
    }

    get user(): Readonly<UserDto> | null {
        return this._user;
    }

    get device(): Readonly<DeviceDto> | null {
        return this._device;
    }

    get permissions(): ReadonlyArray<PermissionDto> {
        return this._permissions;
    }

    get requestLang(): LangEnum {
        return this._userLang ?? this._headerLang;
    }

    get requestCountry(): CountryCode | null {
        return this._requestCountry;
    }

    get settings(): Readonly<UserSettingsDto> | null {
        return this._settings;
    }

    isAuthorized(): boolean {
        return this._user != null;
    }

    hasPermission(key: string): boolean {
        return this._permissions.some((permission) => permission.key === key);
    }

    setUser(user: UserDto): void {
        this._user = user;
    }

    setPermissions(permissions: PermissionDto[]): void {
        this._permissions = [...permissions];
    }

    setDevice(device: DeviceDto): void {
        this._device = device;
    }

    setSettings(settings: UserSettingsDto): void {
        this._settings = settings;
        if (settings.lang) {
            this._userLang = settings.lang;
        }
    }

    setHeaderLang(req: Request): void {
        this._headerLang = getLanguageFromRequest(req);
    }

    setRequestCountry(req: Request): void {
        this._requestCountry = getCountryFromRequest(req);
    }
}
