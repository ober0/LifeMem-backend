import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { ConfirmCodeType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import type { Actor } from '../../common/classes/actor';
import { Phone } from '../../common/classes/phone';
import { appConstants } from '../../common/config/app.constants';
import type { AppConfig, AuthConfig } from '../../common/config/env';
import { appConfig, authConfig } from '../../common/config/env';
import { apiError } from '../../common/helpers/errors';
import { generateCode } from '../../common/helpers/generate-code';
import { translations } from '../../common/translation/text-translations';
import type { AlertBaseDto } from '../../common/types/common/alert-base.dto';
import type { AuthUserInfo, PermissionDto, UserDto, UserSettingsDto } from '../../common/types/user';
import { MobileSmsService } from '../mobile-sms/mobile-sms.service';
import { RoleService } from '../role/role.service';
import { SmtpService } from '../smtp/smtp.service';
import type { AuthUserRecord } from './consts/user.constants';
import type { UserAdminSearchDto, UserAdminSearchResponseDto } from './dto/admin-search.dto';
import type { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import type { ConfirmEmailDto } from './dto/confirm-email.dto';
import type { ConfirmPhoneDto } from './dto/confirm-phone.dto';
import type { CreateUserDto, CreateUserSettings, OauthCreateUser } from './dto/create-user.dto';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { AddEmailDto, AddPhoneDto, UserUpdateSelfDto } from './dto/user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(
        @Inject(authConfig.KEY) private readonly auth: AuthConfig,
        @Inject(appConfig.KEY) private readonly app: AppConfig,
        private readonly userRepository: UserRepository,
        private readonly roleService: RoleService,
        private readonly smtpService: SmtpService,
        private readonly mobileSmsService: MobileSmsService
    ) {}

    async create(dto: CreateUserDto): Promise<RegisterResponseDto> {
        if (dto.phoneNumber && (dto.email || dto.password)) {
            throw apiError.badRequest('auth.single_auth_method_required');
        }

        if (dto.email && dto.password) {
            return this.registerByEmail(dto.nickname, dto.email, dto.password, dto.initSettings);
        }

        if (dto.phoneNumber) {
            return this.registerByPhone(dto.nickname, dto.phoneNumber, dto.initSettings);
        }

        throw apiError.badRequest('auth.no_auth_data');
    }

    private async registerByEmail(
        nickname: string,
        email: string,
        password: string,
        settings: CreateUserSettings
    ): Promise<RegisterResponseDto> {
        const emailOwner = await this.userRepository.findByEmail(email);
        if (emailOwner) {
            throw apiError.conflict('user.email_already_exists');
        }

        const role = await this.roleService.getDefaultRole();
        const passwordHash = await bcrypt.hash(password, this.auth.saltRounds);

        const fullSettings = { ...appConstants.userSettings.base, ...settings };

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
                expiresMinutes: appConstants.code.mobileLifetimeMs / 60_000
            });
        });

        return {
            user: this.toUserDto(user),
            message: translations.byTextKey({
                key: 'common.codeSentEmail',
                lang: fullSettings.lang,
                variables: { code }
            }),
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
            throw apiError.badRequest('user.phone_not_correct');
        }
        if (!phone.isAccess) {
            throw apiError.badRequest('user.phone_not_access');
        }

        const phoneOwner = await this.userRepository.findByPhoneNumber(phone.normalized);
        if (phoneOwner) {
            throw apiError.conflict('user.phone_already_exists');
        }

        const role = await this.roleService.getDefaultRole();

        const fullSettings = { ...appConstants.userSettings.base, ...settings };

        const user = await this.userRepository.create({
            nickname,
            email: null,
            phoneNumber: phone.normalized,
            roleId: role.id,
            settings: fullSettings
        });

        const code = generateCode();
        await this.userRepository.createConfirmationCode({
            type: ConfirmCodeType.Phone,
            code,
            userId: user.id
        });

        if (this.app.isProduction) {
            setImmediate(() => {
                void this.mobileSmsService.sendMessage(phone, code);
            });
        }

        return {
            user: this.toUserDto(user),
            message: translations.byTextKey({
                key: 'common.codeSentPhone',
                lang: fullSettings.lang,
                variables: { code }
            }),
            alert: true
        };
    }

    async confirmEmail(dto: ConfirmEmailDto): Promise<UserDto> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw apiError.notFound('user.not_found');
        }

        if (user.isEmailVerified) {
            throw apiError.badRequest('user.already_verified');
        }

        const confirm = await this.userRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Email,
            Number(dto.code)
        );

        if (!confirm) {
            throw apiError.badRequest('auth.invalid_code');
        }

        const updated = await this.userRepository.markEmailVerified(user.id);
        return this.toUserDto(updated);
    }

    async confirmPhone(dto: ConfirmPhoneDto): Promise<UserDto> {
        const phone = Phone.tryCreate(dto.phone);

        if (!phone) {
            throw apiError.badRequest('user.phone_not_correct');
        }
        if (!phone.isAccess) {
            throw apiError.badRequest('user.phone_not_access');
        }

        const user = await this.userRepository.findByPhoneNumber(phone.normalized);
        if (!user) {
            throw apiError.notFound('user.not_found');
        }

        if (user.isPhoneVerified) {
            throw apiError.badRequest('user.phone_already_verified');
        }

        const confirm = await this.userRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Phone,
            Number(dto.code)
        );

        if (!confirm) {
            throw apiError.badRequest('auth.invalid_code');
        }

        const updated = await this.userRepository.markPhoneVerified(user.id);
        return this.toUserDto(updated);
    }

    async updateSelf(actor: Actor, dto: UserUpdateSelfDto): Promise<UserDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        return this.userRepository.updateNickname(actor.user.id, dto.nickname);
    }

    async addPhone(actor: Actor, dto: AddPhoneDto): Promise<AlertBaseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        if (actor.user.phoneNumber) {
            throw apiError.conflict('user.phone_already_bound');
        }

        const phone = Phone.tryCreate(dto.phoneNumber);
        if (!phone) {
            throw apiError.badRequest('user.phone_not_correct');
        }
        if (!phone.isAccess) {
            throw apiError.badRequest('user.phone_not_access');
        }

        const phoneOwner = await this.userRepository.findByPhoneNumber(phone.normalized);
        if (phoneOwner) {
            throw apiError.conflict('user.phone_already_exists');
        }

        await this.userRepository.setPhoneNumber(actor.user.id, phone.normalized);

        const code = generateCode();
        await this.userRepository.createConfirmationCode({
            type: ConfirmCodeType.Phone,
            code,
            userId: actor.user.id
        });

        if (this.app.isProduction) {
            setImmediate(() => {
                void this.mobileSmsService.sendMessage(phone, code);
            });
        }

        // FIXME убрать variable code
        return {
            message: translations.byTextKey({
                key: 'common.codeSentPhone',
                lang: actor.requestLang,
                variables: { code }
            }),
            alert: true
        };
    }

    async addEmail(actor: Actor, dto: AddEmailDto): Promise<AlertBaseDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        if (actor.user.email) {
            throw apiError.conflict('user.email_already_bound');
        }

        const emailOwner = await this.userRepository.findByEmail(dto.email);
        if (emailOwner) {
            throw apiError.conflict('user.email_already_exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, this.auth.saltRounds);
        const updated = await this.userRepository.setEmailWithPassword(actor.user.id, dto.email, passwordHash);
        if (!updated) {
            throw apiError.notFound('user.not_found');
        }

        const code = generateCode();
        await this.userRepository.createConfirmationCode({
            type: ConfirmCodeType.Email,
            code,
            userId: actor.user.id
        });

        setImmediate(() => {
            this.smtpService.sendCodeEmail({
                to: dto.email,
                code,
                lang: actor.requestLang,
                expiresMinutes: appConstants.code.mobileLifetimeMs / 60_000
            });
        });

        return {
            message: translations.byTextKey({
                key: 'common.codeSentEmail',
                lang: actor.requestLang,
                variables: { code }
            }),
            alert: true
        };
    }

    async findAuthUserById(id: string): Promise<AuthUserInfo> {
        const record = await this.userRepository.findAuthUserById(id);

        if (!record) {
            throw apiError.unauthorized('auth.unauthorized');
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
            ...appConstants.userSettings.base,
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
            throw apiError.notFound('user.not_found');
        }
        return this.toUserDto(user);
    }

    async markPhoneVerified(userId: string): Promise<UserDto> {
        return this.toUserDto(await this.userRepository.markPhoneVerified(userId));
    }

    async createUserWithOAuthProvider(data: OauthCreateUser, initSettings: CreateUserSettings) {
        const role = await this.roleService.getDefaultRole();

        return this.userRepository.createUserWithOAuthProvider(data, role.id, {
            ...appConstants.userSettings.base,
            ...initSettings
        });
    }

    async getBindings(userId: string) {
        return this.userRepository.findBindings(userId);
    }

    async adminSearch(dto: UserAdminSearchDto): Promise<UserAdminSearchResponseDto> {
        const [data, count] = await Promise.all([
            this.userRepository.adminSearch(dto),
            this.userRepository.adminCount(dto)
        ]);

        return {
            data: data.map((user) => this.toUserDto(user)),
            count
        };
    }

    async adminUpdate(actor: Actor, userId: string, dto: AdminUpdateUserDto): Promise<UserDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw apiError.notFound('user.not_found');
        }

        let phoneNumber = dto.phoneNumber;
        if (dto.phoneNumber) {
            const phone = Phone.tryCreate(dto.phoneNumber);
            if (!phone) {
                throw apiError.badRequest('user.phone_not_correct');
            }
            if (!phone.isAccess) {
                throw apiError.badRequest('user.phone_not_access');
            }
            phoneNumber = phone.normalized;
        }

        if (dto.email) {
            const emailOwner = await this.userRepository.findByEmail(dto.email);
            if (emailOwner && emailOwner.id !== userId) {
                throw apiError.conflict('user.email_already_exists');
            }
        }

        if (phoneNumber) {
            const phoneOwner = await this.userRepository.findByPhoneNumber(phoneNumber);
            if (phoneOwner && phoneOwner.id !== userId) {
                throw apiError.conflict('user.phone_already_exists');
            }
        }

        if (dto.roleId) {
            await this.roleService.getRoleById(dto.roleId);
        }

        return this.userRepository.adminUpdate(userId, {
            nickname: dto.nickname,
            email: dto.email,
            phoneNumber,
            isEmailVerified: dto.isEmailVerified,
            isPhoneVerified: dto.isPhoneVerified,
            roleId: dto.roleId
        });
    }

    async adminDelete(actor: Actor, userId: string): Promise<UserDto> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        if (actor.user.id === userId) {
            throw apiError.badRequest('user.no_access');
        }

        const deleted = await this.userRepository.adminDelete(userId);
        if (!deleted) {
            throw apiError.notFound('user.not_found');
        }

        return this.toUserDto(deleted);
    }
}
