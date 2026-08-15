import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BASE_USER_SETTINGS } from '../../common/config/base-user-settings.const';
import { AuthUserInfo, PermissionDto, UserDto, UserSettingsDto } from '../../common/types/user';
import { UserRepository } from './user.repository';
import { AuthUserRecord } from './consts/user.constants';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async getUserInfoFromToken(token: string): Promise<AuthUserInfo> {
        const record = await this.userRepository.findAuthUserByToken(token);

        if (!record) {
            throw new UnauthorizedException('error.auth.invalid_token');
        }

        return this.toAuthUserInfo(record);
    }

    private toAuthUserInfo(record: AuthUserRecord): AuthUserInfo {
        const user: UserDto = {
            id: record.id,
            nickname: record.nickname,
            passwordId: record.passwordId,
            email: record.email,
            phoneNumber: record.phoneNumber,
            roleId: record.roleId,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        };

        const permissions: PermissionDto[] = record.role.permissions.map(({ permission }) => ({
            id: permission.id,
            key: permission.key,
            permissionCategoryId: permission.permissionCategoryId,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt
        }));

        const settings: UserSettingsDto = (record.userSettings?.json as unknown as UserSettingsDto | null) ?? {
            ...BASE_USER_SETTINGS
        };

        return { user, permissions, settings };
    }
}
