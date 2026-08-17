import { Injectable } from '@nestjs/common';
import { ConfirmCodeType, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Phone } from '../../common/classes/phone';
import { BASE_USER_SETTINGS } from '../../common/config/base-user-settings.const';
import { MOBILE_CODE_LIFETIME_MS } from '../../common/config/contains';
import { apiError } from '../../common/errors';
import { generateCode } from '../../common/helpers/generate-code';
import { AuthUserInfo, PermissionDto, UserDto, UserSettingsDto } from '../../common/types/user';
import { MobileSmsService } from '../mobile-sms/mobile-sms.service';
import { RoleService } from '../role/role.service';
import { SmtpService } from '../smtp/smtp.service';
import { AuthUserRecord } from './consts/user.constants';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ConfirmPhoneDto } from './dto/confirm-phone.dto';
import { CreateUserDto, CreateUserSettings, OauthCreateUser } from './dto/create-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleService: RoleService,
        private readonly smtpService: SmtpService,
        private readonly mobileSmsService: MobileSmsService
    ) {}

    async create(dto: CreateUserDto): Promise<RegisterResponseDto> {
        if (dto.phoneNumber && (dto.email || dto.password)) {
            throw apiError.badRequest('error.auth.single_auth_method_required');
        }

        if (dto.email && dto.password) {
            return this.registerByEmail(dto.nickname, dto.email, dto.password, dto.initSettings);
        }

        if (dto.phoneNumber) {
            return this.registerByPhone(dto.nickname, dto.phoneNumber, dto.initSettings);
        }

        throw apiError.badRequest('error.auth.no_auth_data');
    }

    private async registerByEmail(
        nickname: string,
        email: string,
        password: string,
        settings: CreateUserSettings
    ): Promise<RegisterResponseDto> {
        const emailOwner = await this.userRepository.findByEmail(email);
        if (emailOwner) {
            throw apiError.conflict('error.user.email_already_exists');
        }

        const role = await this.roleService.getDefaultRole();
        const passwordHash = await bcrypt.hash(password, 10);

        const fullSettings = { ...BASE_USER_SETTINGS, ...settings };

        const user = await this.userRepository.create({
            nickname,
            email,
            phoneNumber: null,
            roleId: role.id,
            passwordHash,
            settings: fullSettings
        });

        const code = generateCode();
        await this.userRepository.createConfirmationCode({
            type: ConfirmCodeType.Email,
            code,
            userId: user.id
        });

        setImmediate(() => {
            this.smtpService.sendCodeEmail({
                to: email,
                code,
                lang: fullSettings.lang,
                expiresMinutes: MOBILE_CODE_LIFETIME_MS / 60_000
            });
        });

        // FIXME
        return {
            user: this.toUserDto(user),
            message: `Код подтверждения ${code} отправлен на email`,
            alert: true
        };
    }

    private async registerByPhone(
        nickname: string,
        phoneNumber: string,
        settings: CreateUserSettings
    ): Promise<RegisterResponseDto> {
        const phone = Phone.tryCreate(phoneNumber);

        if (!phone) {
            throw apiError.badRequest('error.user.phone_not_correct');
        }
        if (!phone.isAccess) {
            throw apiError.badRequest('error.user.phone_not_access');
        }

        const phoneOwner = await this.userRepository.findByPhoneNumber(phone.normalized);
        if (phoneOwner) {
            throw apiError.conflict('error.user.phone_already_exists');
        }

        const role = await this.roleService.getDefaultRole();

        const user = await this.userRepository.create({
            nickname,
            email: null,
            phoneNumber: phone.normalized,
            roleId: role.id,
            settings: { ...BASE_USER_SETTINGS, ...settings }
        });

        const code = generateCode();
        await this.userRepository.createConfirmationCode({
            type: ConfirmCodeType.Phone,
            code,
            userId: user.id
        });

        if (process.env.NODE_ENV === 'production') {
            setImmediate(() => {
                void this.mobileSmsService.sendMessage(phone, code);
            });
        }

        if (process.env.NODE_ENV === 'production') {
            // FIXME
            return {
                user: this.toUserDto(user),
                message: `Код ${code} отправлен`,
                alert: true
            };
        }

        return {
            user: this.toUserDto(user),
            message: `Код ${code} отправлен`,
            alert: true
        };
    }

    async confirmEmail(dto: ConfirmEmailDto): Promise<UserDto> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw apiError.notFound('error.user.not_found');
        }

        if (user.isEmailVerified) {
            throw apiError.badRequest('error.user.already_verified');
        }

        const confirm = await this.userRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Email,
            Number(dto.code)
        );

        if (!confirm) {
            throw apiError.badRequest('error.auth.invalid_code');
        }

        const updated = await this.userRepository.markEmailVerified(user.id);
        return this.toUserDto(updated);
    }

    async confirmPhone(dto: ConfirmPhoneDto): Promise<UserDto> {
        const phone = Phone.tryCreate(dto.phone);

        if (!phone) {
            throw apiError.badRequest('error.user.phone_not_correct');
        }
        if (!phone.isAccess) {
            throw apiError.badRequest('error.user.phone_not_access');
        }

        const user = await this.userRepository.findByPhoneNumber(phone.normalized);
        if (!user) {
            throw apiError.notFound('error.user.not_found');
        }

        if (user.isPhoneVerified) {
            throw apiError.badRequest('error.user.phone_already_verified');
        }

        const confirm = await this.userRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Phone,
            Number(dto.code)
        );

        if (!confirm) {
            throw apiError.badRequest('error.auth.invalid_code');
        }

        const updated = await this.userRepository.markPhoneVerified(user.id);
        return this.toUserDto(updated);
    }

    async getUserInfoFromToken(token: string): Promise<AuthUserInfo> {
        let payload: { id: string };

        try {
            payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { id: string };
        } catch {
            throw apiError.unauthorized('error.auth.invalid_token');
        }

        if (!payload?.id) {
            throw apiError.unauthorized('error.auth.invalid_token');
        }

        const record = await this.userRepository.findAuthUserById(payload.id);

        if (!record) {
            throw apiError.unauthorized('error.auth.unauthorized');
        }

        return this.toAuthUserInfo(record);
    }

    private toUserDto(user: User): UserDto {
        return {
            id: user.id,
            nickname: user.nickname,
            passwordId: user.passwordId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            roleId: user.roleId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    private toAuthUserInfo(record: AuthUserRecord): AuthUserInfo {
        const user = this.toUserDto(record);

        const permissions: PermissionDto[] = record.role.permissions.map(({ permission }) => ({
            id: permission.id,
            key: permission.key,
            permissionCategoryId: permission.permissionCategoryId,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt
        }));

        const settings: UserSettingsDto = {
            ...BASE_USER_SETTINGS,
            ...((record.userSettings?.json as unknown as UserSettingsDto) ?? {})
        };

        return { user, permissions, settings };
    }

    async findOneByEmailWithPassword(email: string) {
        return this.userRepository.findByEmailWithPassword(email);
    }

    async findByPhone(phone: Phone) {
        return this.userRepository.findByPhone(phone.normalized);
    }

    async findOneById(id: string): Promise<UserDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw apiError.notFound('error.user.not_found');
        }
        return this.toUserDto(user);
    }

    async markPhoneVerified(userId: string): Promise<UserDto> {
        return this.toUserDto(await this.userRepository.markPhoneVerified(userId));
    }

    async createUserWithOAuthProvider(data: OauthCreateUser, initSettings: CreateUserSettings) {
        const role = await this.roleService.getDefaultRole();

        return this.userRepository.createUserWithOAuthProvider(data, role.id, {
            ...BASE_USER_SETTINGS,
            ...initSettings
        });
    }

    async getBindings(userId: string) {
        return this.userRepository.findBindings(userId);
    }
}
