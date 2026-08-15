import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';

@Module({
    imports: [RoleModule],
    providers: [UserRepository, UserService],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule {}
