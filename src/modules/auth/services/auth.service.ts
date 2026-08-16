import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthType, ConfirmCodeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { Phone } from '../../../common/classes/phone';
import { EMAIL_CODE_LIFETIME_MS } from '../../../common/config/contains';
import { generateCode } from '../../../common/helpers/generate-code';
import { LangEnum } from '../../../common/types/lang.enum';
import { AuthLogService } from '../../auth-log/auth-log.service';
import { MobileSmsService } from '../../mobile-sms/mobile-sms.service';
import { NotificationMessage, NotificationType } from '../../notifications/const/messages';
import { NotificationsService } from '../../notifications/notifications.service';
import { SmtpService } from '../../smtp/smtp.service';
import { UserService } from '../../user/user.service';
import { ConfirmPhoneDto } from '../dto/confirm-phone.dto';
import { LoginDto } from '../dto/login.dto';
import {
    GeneratedTokens,
    LoginFullResponseDto,
    LoginPhoneCodeResponseDto,
    SaveTokenDto,
    TokenPayload
} from '../dto/tokens.dto';
import { AuthRepository } from '../repo/auth.repository';

@Injectable()
export class AuthService {
    private readonly saltRounds = process.env.SALT_ROUNDS;

    constructor(
        private readonly userService: UserService,
        private readonly authRepository: AuthRepository,
        private readonly authLogService: AuthLogService,
        private readonly mobileSmsService: MobileSmsService,
        private readonly notificationService: NotificationsService,
        private readonly smtpService: SmtpService
    ) {
        if (!this.saltRounds) {
            throw Error('Не указана SALT_ROUNDS в енвах');
        }
    }

    onModuleInit() {
        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error('Не указан JWT_REFRESH_SECRET');
        }

        if (!process.env.JWT_ACCESS_SECRET) {
            throw new Error('Не указан JWT_ACCESS_SECRET');
        }
    }

    private hashRefreshToken(refreshToken: string): string {
        return createHmac('sha256', process.env.JWT_REFRESH_SECRET!).update(refreshToken).digest('hex');
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

    async authByEmail(email: string, password: string, ip: string): Promise<LoginFullResponseDto> {
        const user = await this.userService.findOneByEmailWithPassword(email);

        if (!user?.passwordId || !user.password) {
            throw new UnauthorizedException('error.auth.invalid_credentials');
        }

        const isPasswordMatching = await this.comparePassword(password, user.password.password);

        if (!isPasswordMatching) {
            throw new UnauthorizedException('error.auth.invalid_credentials');
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
                    lang: LangEnum.Ru,
                    expiresMinutes: EMAIL_CODE_LIFETIME_MS / 60000
                });
            });

            // FIXME
            if (process.env.NODE_ENV === 'production') {
                return {
                    message: `Код подтверждения ${code} отправлен на email`,
                    alert: true
                };
            }
            return {
                message: `Код подтверждения ${code} отправлен на email`,
                alert: true
            };
        }

        const { refreshToken, accessToken } = this.generateTokens(user.id);

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

    async sendPhoneCode(phone: string): Promise<LoginPhoneCodeResponseDto> {
        const phoneObj = Phone.tryCreate(phone);

        if (!phoneObj) {
            throw new BadRequestException('error.user.phone_not_correct');
        }
        if (!phoneObj.isAccess) {
            throw new BadRequestException('error.user.phone_not_access');
        }

        const user = await this.userService.findByPhone(phoneObj);
        if (!user) {
            throw new UnauthorizedException('error.auth.invalid_credentials');
        }

        const code = generateCode();

        await this.createCode({
            type: ConfirmCodeType.Phone,
            code,
            userId: user.id
        });

        if (process.env.NODE_ENV === 'production') {
            setImmediate(() => {
                void this.mobileSmsService.sendMessage(phoneObj, code);
            });
        }

        if (process.env.NODE_ENV === 'production') {
            // TODO убрать потом
            return {
                message: `Код ${code} отправлен`,
                alert: true
            };
        }
        return {
            message: `Код ${code} отправлен`,
            alert: true
        };
    }

    async confirmPhoneLogin(dto: ConfirmPhoneDto, ip: string) {
        const phoneObj = Phone.tryCreate(dto.phone);

        if (!phoneObj) {
            throw new BadRequestException('error.user.phone_not_correct');
        }
        if (!phoneObj.isAccess) {
            throw new BadRequestException('error.user.phone_not_access');
        }

        const user = await this.userService.findByPhone(phoneObj);
        if (!user) {
            throw new UnauthorizedException('error.auth.invalid_credentials');
        }

        const confirm = await this.authRepository.consumeValidConfirmationCode(
            user.id,
            ConfirmCodeType.Phone,
            Number(dto.code)
        );

        if (!confirm) {
            throw new BadRequestException('error.auth.invalid_code');
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

    async login(dto: LoginDto, ip: string): Promise<LoginFullResponseDto> {
        if (dto.phone && (dto.email || dto.password)) {
            throw new BadRequestException('error.auth.single_auth_method_required');
        }

        if (dto.phone) {
            return this.sendPhoneCode(dto.phone);
        }

        if (dto.email && dto.password) {
            return this.authByEmail(dto.email, dto.password, ip);
        }

        throw new BadRequestException('error.auth.no_auth_params');
    }

    async logout(refreshToken: string) {
        const hashedToken = this.hashRefreshToken(refreshToken);
        const token = await this.authRepository.findTokenByToken(hashedToken);
        if (!token) {
            throw new ForbiddenException('error.auth.invalid_token');
        }
        return this.authRepository.deleteToken(token.id);
    }

    async refresh(refreshToken: string, ip: string): Promise<GeneratedTokens> {
        if (!refreshToken) {
            throw new UnauthorizedException('error.auth.refresh_token_not_found');
        }
        const hashedToken = this.hashRefreshToken(refreshToken);
        const tokenInDb = await this.authRepository.findTokenByToken(hashedToken);

        if (!tokenInDb) {
            throw new UnauthorizedException('error.auth.invalid_token');
        }

        let decodedJwt: TokenPayload;
        try {
            decodedJwt = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
        } catch {
            throw new UnauthorizedException('error.auth.invalid_token');
        }

        if (tokenInDb.userId !== decodedJwt.id) {
            throw new UnauthorizedException('error.auth.invalid_token');
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

        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
            expiresIn: '1h'
        }) as string;

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: '7d'
        }) as string;

        return { accessToken, refreshToken };
    }

    private async createCode(data: { type: ConfirmCodeType; code: string; userId: string }) {
        await this.authRepository.createConfirmationCode(data);
    }
}
