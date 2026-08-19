import type { UserDto } from '../../../modules/user/dto/user.dto';
import type { UserSettingsDto } from '../../../modules/user-settings/dto/user-settings.dto';
import type { PermissionDto } from './permission.dto';

export type AuthUserInfo = {
    user: UserDto;
    permissions: PermissionDto[];
    settings: UserSettingsDto;
};
