import { Module } from '@nestjs/common';

import { AppleApiModule } from '../apple-api/apple-api.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { GoogleApiModule } from '../google-api/google-api.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmtpModule } from '../smtp/smtp.module';
import { TelegramApiModule } from '../telegram-api/telegram-api.module';
import { AuthController } from './controllers/auth.controller';
import { AuthAppleController } from './controllers/auth-apple.controller';
import { AuthGoogleController } from './controllers/auth-google.controller';
import { AuthTelegramController } from './controllers/auth-telegram.controller';
import { AuthRepository } from './repo/auth.repository';
import { UserOAuthRepository } from './repo/user-oauth.repository';
import { AuthService } from './services/auth.service';
import { AuthAppleService } from './services/auth-apple.service';
import { AuthCleanupService } from './services/auth-cleanup.service';
import { AuthGoogleService } from './services/auth-google.service';
import { AuthTelegramService } from './services/auth-telegram.service';

@Module({
    imports: [
        GoogleApiModule,
        AppleApiModule,
        TelegramApiModule,
        AuthLogModule,
        MobileSmsModule,
        NotificationsModule,
        SmtpModule
    ],
    controllers: [AuthController, AuthGoogleController, AuthAppleController, AuthTelegramController],
    providers: [
        AuthService,
        AuthGoogleService,
        AuthAppleService,
        AuthTelegramService,
        UserOAuthRepository,
        AuthRepository,
        AuthCleanupService
    ],
    exports: [AuthService]
})
export class AuthModule {}
