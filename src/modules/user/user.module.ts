import { Global, Module } from '@nestjs/common';
import { MobileSmsModule } from '../mobile-sms/mobile-sms.module';
import { RoleModule } from '../role/role.module';
import { SmtpModule } from '../smtp/smtp.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Global()
@Module({
    imports: [RoleModule, SmtpModule, MobileSmsModule],
    providers: [UserRepository, UserService],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule {}
