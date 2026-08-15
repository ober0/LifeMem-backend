import { PermissionDto } from './permission.dto';
import { UserDto } from './user.dto';
import { UserSettingsDto } from './user-settings.dto';

export type AuthUserInfo = {
    user: UserDto;
    permissions: PermissionDto[];
    settings: UserSettingsDto;
};
