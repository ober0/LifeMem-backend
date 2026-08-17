import { PermissionDto } from './permission.dto';
import { UserDto } from '../../../modules/user/dto/user.dto';
import { UserSettingsDto } from '../../../modules/user-settings/dto/user-settings.dto';

export type AuthUserInfo = {
    user: UserDto;
    permissions: PermissionDto[];
    settings: UserSettingsDto;
};
