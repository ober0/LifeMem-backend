import type { UserDto } from '../../../api/user/dto/user.dto';
import type { UserSettingsDto } from '../../../api/user-settings/dto/user-settings.dto';
import type { PermissionDto } from './permission.dto';

export type AuthUserInfo = {
    user: UserDto;
    permissions: PermissionDto[];
    settings: UserSettingsDto;
};
