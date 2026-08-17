import { Module } from '@nestjs/common';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { AppleApiModule } from '../apple-api/apple-api.module';
import { GoogleApiModule } from '../google-api/google-api.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmtpModule } from '../smtp/smtp.module';
import { AuthAppleController } from './controllers/auth-apple.controller';
import { AuthGoogleController } from './controllers/auth-google.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repo/auth.repository';
import { UserOAuthRepository } from './repo/user-oauth.repository';
import { AuthAppleService } from './services/auth-apple.service';
import { AuthGoogleService } from './services/auth-google.service';
import { AuthService } from './services/auth.service';
import { UserSettingsModule } from '../user-settings/user-settings.module';

@Module({
    imports: [
        GoogleApiModule,
        AppleApiModule,
        AuthLogModule,
        MobileSmsModule,
        NotificationsModule,
        SmtpModule,
        UserSettingsModule
    ],
    controllers: [AuthController, AuthGoogleController, AuthAppleController],
    providers: [AuthService, AuthGoogleService, AuthAppleService, AuthRepository, UserOAuthRepository],
    exports: [AuthService]
})
export class AuthModule {}
