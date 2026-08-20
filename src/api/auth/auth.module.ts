import { Module } from '@nestjs/common';

import { AppleApiModule } from '../apple-api/apple-api.module';
import { AuthLogModule } from '../auth-log/auth-log.module';
import { GoogleApiModule } from '../google-api/google-api.module';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SmtpModule } from '../smtp/smtp.module';
import { AuthController } from './controllers/auth.controller';
import { AuthAppleController } from './controllers/auth-apple.controller';
import { AuthGoogleController } from './controllers/auth-google.controller';
import { AuthRepository } from './repo/auth.repository';
import { UserOAuthRepository } from './repo/user-oauth.repository';
import { AuthService } from './services/auth.service';
import { AuthAppleService } from './services/auth-apple.service';
import { AuthGoogleService } from './services/auth-google.service';

@Module({
    imports: [GoogleApiModule, AppleApiModule, AuthLogModule, MobileSmsModule, NotificationsModule, SmtpModule],
    controllers: [AuthController, AuthGoogleController, AuthAppleController],
    providers: [AuthService, AuthGoogleService, AuthAppleService, AuthRepository, UserOAuthRepository],
    exports: [AuthService]
})
export class AuthModule {}
