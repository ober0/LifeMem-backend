import { Body, Controller, Get, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Actor } from '../../common/classes/actor';
import { UserDto } from '../../common/types/user';
import { CurrentActor } from '../auth/decorators/current-actor.decorator';
import { RoleService } from '../role/role.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SelfDto } from './dto/self.dto';
import { UserService } from './user.service';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService
    ) {}

    @Post()
    @ApiOperation({ summary: 'Создание пользователя' })
    @ApiCreatedResponse({ type: UserDto })
    async create(@Body() dto: CreateUserDto): Promise<UserDto> {
        return this.userService.create(dto);
    }

    @Get('self')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Получение информации о себе' })
    @ApiOkResponse({ type: SelfDto })
    async self(@CurrentActor() actor: Actor) {
        if (!actor.user) {
            throw new UnauthorizedException('error.auth.unauthorized');
        }

        const role = await this.roleService.getRoleById(actor.user.roleId);

        return {
            info: actor.user,
            permissions: actor.permissions,
            role
        };
    }
}
