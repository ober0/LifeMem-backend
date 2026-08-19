import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { apiError } from '../../common/helpers/errors';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { UserDto } from '../../common/types/user';
import type { RoleService } from '../role/role.service';
import { OAuthBindingDto } from './dto/bindings.dto';
import type { ConfirmEmailDto } from './dto/confirm-email.dto';
import type { ConfirmPhoneDto } from './dto/confirm-phone.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { SelfDto } from './dto/self.dto';
import type { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService
    ) {}

    @Post()
    @ApiOperation({
        summary: 'Регистрация'
    })
    @ApiCreatedResponse({ type: RegisterResponseDto })
    @ApiErrorResponses(400, 409)
    async create(@Body() dto: CreateUserDto): Promise<RegisterResponseDto> {
        return this.userService.create(dto);
    }

    @Post('confirm-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Подтверждение email' })
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 404)
    async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<UserDto> {
        return this.userService.confirmEmail(dto);
    }

    @Post('confirm-phone')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Подтверждение телефона' })
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 404)
    async confirmPhone(@Body() dto: ConfirmPhoneDto): Promise<UserDto> {
        return this.userService.confirmPhone(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'Получение информации о себе' })
    @ApiOkResponse({ type: SelfDto })
    @ApiErrorResponses(401, 404)
    async info(@CurrentActor() actor: Actor) {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        const role = await this.roleService.getRoleById(actor.user.roleId);

        return {
            info: actor.user,
            permissions: actor.permissions,
            role
        };
    }

    @ApiOperation({ summary: 'Получить привязки' })
    @Get('me/bindings')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOkResponse({ type: OAuthBindingDto, isArray: true })
    @ApiErrorResponses(401)
    async getBindings(@CurrentActor() actor: Actor): Promise<OAuthBindingDto[]> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        return this.userService.getBindings(actor.user.id);
    }
}
