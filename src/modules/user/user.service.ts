import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Phone } from '../../common/classes/phone';
import { BASE_USER_SETTINGS } from '../../common/config/base-user-settings.const';
import { AuthUserInfo, PermissionDto, UserDto, UserSettingsDto } from '../../common/types/user';
import { RoleService } from '../role/role.service';
import { AuthUserRecord } from './consts/user.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleService: RoleService
    ) {}

    async create(dto: CreateUserDto): Promise<UserDto> {
        if (!dto.email && !dto.phoneNumber) {
            throw new BadRequestException('error.auth.no_auth_data');
        }

        let normalizedPhone: string | null = null;

        if (dto.email) {
            const emailOwner = await this.userRepository.findByEmail(dto.email);
            if (emailOwner) {
                throw new ConflictException('error.user.email_already_exists');
            }
        }

        if (dto.phoneNumber) {
            const phone = Phone.tryCreate(dto.phoneNumber);

            if (!phone) {
                throw new BadRequestException('error.user.phone_not_correct');
            }
            if (!phone.isAccess) {
                throw new BadRequestException('error.user.phone_not_access');
            }

            normalizedPhone = phone.normalized;

            const phoneOwner = await this.userRepository.findByPhoneNumber(normalizedPhone);
            if (phoneOwner) {
                throw new ConflictException('error.user.phone_already_exists');
            }
        }

        const role = await this.roleService.getDefaultRole();
        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.userRepository.create({
            nickname: dto.nickname,
            email: dto.email,
            phoneNumber: normalizedPhone,
            roleId: role.id,
            passwordHash,
            settings: BASE_USER_SETTINGS
        });

        return {
            id: user.id,
            nickname: user.nickname,
            passwordId: user.passwordId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            roleId: user.roleId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

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
