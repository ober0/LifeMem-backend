import { DeviceDto } from '../../types/user/device.dto';
import { PermissionDto } from '../../types/user/permission.dto';
import { UserDto } from '../../../modules/user/dto/user.dto';
import { UserSettingsDto } from '../../../modules/user/dto/user-settings.dto';

export class Actor {
    private _user: UserDto | null = null;
    private _permissions: PermissionDto[] = [];
    private _device: DeviceDto | null = null;
    private _settings: UserSettingsDto | null = null;

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
    }
}
