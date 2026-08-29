import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type express from 'express';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { Permission } from '../../common/config/role-permission';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { ThrottleByIp, ThrottleByUser } from '../../common/decorators/throttle-by-user.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { apiError } from '../../common/helpers/errors';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { AlertBaseDto } from '../../common/types/common/alert-base.dto';
import { RoleService } from '../role/role.service';
import { OAuthBindingDto } from './dto/bindings.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ConfirmPhoneDto } from './dto/confirm-phone.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { SelfDto } from './dto/self.dto';
import { AddEmailDto, AddPhoneDto, UserDto, UserUpdateSelfDto } from './dto/user.dto';
import { UserService } from './user.service';

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
    async create(@Body() dto: CreateUserDto, @Req() request: express.Request): Promise<RegisterResponseDto> {
        return this.userService.create(dto, request.serverSettings, request.actor);
    }

    @Post('confirm-email')
    @HttpCode(HttpStatus.OK)
    @ThrottleByUser({ limit: 10 })
    @ThrottleByIp({ limit: 10 })
    @ApiOperation({ summary: 'Подтверждение email' })
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 404)
    async confirmEmail(@Body() dto: ConfirmEmailDto): Promise<UserDto> {
        return this.userService.confirmEmail(dto);
    }

    @Post('confirm-phone')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Подтверждение телефона' })
    @ThrottleByUser({ limit: 10 })
    @ThrottleByIp({ limit: 10 })
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 404)
    async confirmPhone(@Body() dto: ConfirmPhoneDto): Promise<UserDto> {
        return this.userService.confirmPhone(dto);
    }

    @Get('me')
    @UseGuards(
        JwtAuthGuardHttp({
            allowSofDeleted: true
        })
    )
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
    @UseGuards(
        JwtAuthGuardHttp({
            allowSofDeleted: true
        })
    )
    @ApiOkResponse({ type: OAuthBindingDto, isArray: true })
    @ApiErrorResponses(401)
    async getBindings(@CurrentActor() actor: Actor): Promise<OAuthBindingDto[]> {
        if (!actor.user) {
            throw apiError.unauthorized('auth.unauthorized');
        }

        return this.userService.getBindings(actor.user.id);
    }

    @ApiOperation({ summary: 'Обновление себя' })
    @Patch('me')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 401)
    async updateSelf(@CurrentActor() actor: Actor, @Body() dto: UserUpdateSelfDto): Promise<UserDto> {
        return this.userService.updateSelf(actor, dto);
    }

    @ApiOperation({ summary: 'Добавить привязку по телефону' })
    @Patch('add-phone')
    @UseGuards(JwtAuthGuardHttp({}))
    @ThrottleByUser({ limit: 5 })
    @ThrottleByIp({ limit: 3 })
    @ApiOkResponse({ type: AlertBaseDto })
    @ApiErrorResponses(400, 401, 409)
    async addPhone(@CurrentActor() actor: Actor, @Body() dto: AddPhoneDto): Promise<AlertBaseDto> {
        return this.userService.addPhone(actor, dto);
    }

    @ApiOperation({ summary: 'Добавить привязку по email' })
    @Patch('add-email')
    @UseGuards(JwtAuthGuardHttp({}))
    @ThrottleByUser({ limit: 5 })
    @ThrottleByIp({ limit: 3 })
    @ApiOkResponse({ type: AlertBaseDto })
    @ApiErrorResponses(400, 401, 409)
    async addEmail(@CurrentActor() actor: Actor, @Body() dto: AddEmailDto): Promise<AlertBaseDto> {
        return this.userService.addEmail(actor, dto);
    }

    @Delete('soft')
    @ApiOperation({ summary: 'Удаление себя (soft)' })
    @ApiOkResponse()
    @UseGuards(JwtAuthGuardHttp({ permissions: [Permission.UsersAdminHardDelete] }))
    @ApiErrorResponses(403, 404)
    async deleteSoft(@CurrentActor() actor: Actor) {
        await this.userService.softDelete(actor);
    }

    @Post('restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Восстановление аккаунта' })
    @UseGuards(JwtAuthGuardHttp({ allowSofDeleted: true }))
    @ApiOkResponse({ type: UserDto })
    @ApiErrorResponses(400, 401)
    async restore(@CurrentActor() actor: Actor): Promise<UserDto> {
        return this.userService.restore(actor);
    }
}
