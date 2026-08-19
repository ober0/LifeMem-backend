import { Inject, Injectable } from '@nestjs/common';
import { AuthType, ConfirmCodeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { Actor } from 'src/common/classes/actor';

import { Phone } from '../../../common/classes/phone';
import { appConstants } from '../../../common/config/app.constants';
import type { AppConfig,AuthConfig} from '../../../common/config/env';
import { appConfig, authConfig } from '../../../common/config/env';
import { apiError } from '../../../common/helpers/errors';
import { generateCode } from '../../../common/helpers/generate-code';
import { translations } from '../../../common/translation/text-translations';
import type { AuthLogService } from '../../auth-log/auth-log.service';
import type { MobileSmsService } from '../../mobile-sms/mobile-sms.service';
import { NotificationMessage, NotificationType } from '../../notifications/const/messages';
import type { NotificationsService } from '../../notifications/notifications.service';
import type { SmtpService } from '../../smtp/smtp.service';
import type { UserService } from '../../user/user.service';
import type { ConfirmPhoneDto } from '../dto/confirm-phone.dto';
import type { LoginDto } from '../dto/login.dto';
import type {
    GeneratedTokens,
    LoginFullResponseDto,
    LoginPhoneCodeResponseDto,
    SaveTokenDto,
    TokenPayload
} from '../dto/tokens.dto';
import type { AuthRepository } from '../repo/auth.repository';

@Injectable()
export class AuthService {
    constructor(
        @Inject(authConfig.KEY) private readonly auth: AuthConfig,
        @Inject(appConfig.KEY) private readonly app: AppConfig,
        private readonly userService: UserService,
        private readonly authRepository: AuthRepository,
        private readonly authLogService: AuthLogService,
        private readonly mobileSmsService: MobileSmsService,
        private readonly notificationService: NotificationsService,
        private readonly smtpService: SmtpService
    ) {}

    private hashRefreshToken(refreshToken: string): string {
        return createHmac('sha256', this.auth.jwtRefreshSecret).update(refreshToken).digest('hex');
    }

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }

    async saveToken(payload: SaveTokenDto) {
        const hashedToken = this.hashRefreshToken(payload.refreshToken);
        return this.authRepository.saveToken({
            ...payload,
            refreshToken: hashedToken
        });
    }

    async authByEmail(email: string, password: string, actor: Actor): Promise<LoginFullResponseDto> {
        const user = await this.userService.findOneByEmailWithPassword(email);

        if (!user?.passwordId || !user.password) {
            throw apiError.unauthorized('auth.invalid_credentials');
        }

        const isPasswordMatching = await this.comparePassword(password, user.password.password);

        if (!isPasswordMatching) {
            throw apiError.unauthorized('auth.invalid_credentials');
        }

        if (!user.isEmailVerified) {
            const code = generateCode();

            await this.createCode({
                type: ConfirmCodeType.Email,
                code,
                userId: user.id
            });
            setImmediate(() => {
                this.smtpService.sendCodeEmail({
                    to: email,
                    code,
                    lang: actor.requestLang,
                    expiresMinutes: appConstants.code.emailLifetimeMs / 60000
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

        const { refreshToken, accessToken } = this.generateTokens(user.id);

        const ip = actor.device?.ip ?? '';

        setImmediate(() => {
            void this.notificationService.create({
                userId: user.id,
                type: NotificationType.LoginToAccount,
                title: NotificationMessage.LoginToAccount.title,
                body: NotificationMessage.LoginToAccount.description
            });

            void this.authLogService.create({
                userId: user.id,
                type: AuthType.Email,
                ip
            });
        });

        await this.saveToken({ userId: user.id, refreshToken, ip });

        const { password: _, ...restUser } = user;

        return { accessToken, refreshToken, user: restUser };
    }

    async sendPhoneCode(phone: string, lang: Actor['requestLang']): Promise<LoginPhoneCodeResponseDto> {
        const phoneObj = Phone.tryCreate(phone);

        if (!phoneObj) {
            throw apiError.badRequest('user.phone_not_correct');
        }
        if (!phoneObj.isAccess) {
            throw apiError.badRequest('user.phone_not_access');
        }

        const user = await this.userService.findByPhone(phoneObj);
        if (!user) {
            throw apiError.unauthorized('auth.invalid_credentials');
        }

        const code = generateCode();

        await this.createCode({
            type: ConfirmCodeType.Phone,
            code,
            userId: user.id
        });

        if (this.app.isProduction) {
            setImmediate(() => {
                void this.mobileSmsService.sendMessage(phoneObj, code);
            });
        }

        return {
            message: translations.byTextKey({
                key: 'common.codeSentPhone',
                lang,
                variables: { code }
            }),
            alert: true
        };
    }

    async confirmPhoneLogin(dto: ConfirmPhoneDto, ip: string) {
        const phoneObj = Phone.tryCreate(dto.phone);

        if (!phoneObj) {
            throw apiError.badRequest('user.phone_not_correct');
        }
        if (!phoneObj.isAccess) {
            throw apiError.badRequest('user.phone_not_access');
        }

        const user = await this.userService.findByPhone(phoneObj);
        if (!user) {
            throw apiError.unauthorized('auth.invalid_credentials');
        }

        const confirm = await this.authRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Phone,
            Number(dto.code)
        );

        if (!confirm) {
            throw apiError.badRequest('auth.invalid_code');
        }

        const verifiedUser = user.isPhoneVerified ? user : await this.userService.markPhoneVerified(user.id);

        const { refreshToken, accessToken } = this.generateTokens(verifiedUser.id);
        await this.saveToken({ userId: verifiedUser.id, refreshToken, ip });

        setImmediate(() => {
            void this.authLogService.create({
                userId: verifiedUser.id,
                type: AuthType.Phone,
                ip
            });

            void this.notificationService.create({
                userId: verifiedUser.id,
                type: NotificationType.LoginToAccount,
                title: NotificationMessage.LoginToAccount.title,
                body: NotificationMessage.LoginToAccount.description
            });
        });

        return { accessToken, refreshToken, user: verifiedUser };
    }

    async login(dto: LoginDto, actor: Actor): Promise<LoginFullResponseDto> {
        if (dto.phone && (dto.email || dto.password)) {
            throw apiError.badRequest('auth.single_auth_method_required');
        }

        if (dto.phone) {
            return this.sendPhoneCode(dto.phone, actor.requestLang);
        }

        if (dto.email && dto.password) {
            return this.authByEmail(dto.email, dto.password, actor);
        }

        throw apiError.badRequest('auth.no_auth_params');
    }

    async logout(refreshToken: string) {
        const hashedToken = this.hashRefreshToken(refreshToken);
        const token = await this.authRepository.findTokenByToken(hashedToken);
        if (!token) {
            throw apiError.forbidden('auth.invalid_token');
        }
        return this.authRepository.deleteToken(token.id);
    }

    async refresh(refreshToken: string, ip: string): Promise<GeneratedTokens> {
        if (!refreshToken) {
            throw apiError.unauthorized('auth.refresh_token_not_found');
        }
        const hashedToken = this.hashRefreshToken(refreshToken);
        const tokenInDb = await this.authRepository.findTokenByToken(hashedToken);

        if (!tokenInDb) {
            throw apiError.unauthorized('auth.invalid_token');
        }

        let decodedJwt: TokenPayload;
        try {
            decodedJwt = jwt.verify(refreshToken, this.auth.jwtRefreshSecret) as TokenPayload;
        } catch {
            throw apiError.unauthorized('auth.invalid_token');
        }

        if (tokenInDb.userId !== decodedJwt.id) {
            throw apiError.unauthorized('auth.invalid_token');
        }

        const { refreshToken: newRefreshToken, accessToken } = this.generateTokens(decodedJwt.id);

        await Promise.all([
            this.authRepository.deleteToken(tokenInDb.id),
            this.saveToken({ userId: decodedJwt.id, refreshToken: newRefreshToken, ip })
        ]);

        return { refreshToken: newRefreshToken, accessToken };
    }

    generateTokens(userId: string): GeneratedTokens {
        const payload: TokenPayload = { id: userId };

        const accessToken = jwt.sign(payload, this.auth.jwtAccessSecret, {
            expiresIn: '1h'
        }) as string;

        const refreshToken = jwt.sign(payload, this.auth.jwtRefreshSecret, {
            expiresIn: '7d'
        }) as string;

        return { accessToken, refreshToken };
    }

    private async createCode(data: { type: ConfirmCodeType; code: string; userId: string }) {
        await this.authRepository.createConfirmationCode(data);
    }
}
