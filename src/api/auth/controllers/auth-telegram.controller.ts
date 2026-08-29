import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type express from 'express';

import type { Actor } from '../../../common/classes/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { ThrottleByIp, ThrottleByUser } from '../../../common/decorators/throttle-by-user.decorator';
import { JwtAuthGuardHttp } from '../../../common/guards/auth.guard';
import { apiError } from '../../../common/helpers/errors';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { DeviceType } from '../../../common/types/user';
import { TelegramAuthDto, TelegramLinkDto } from '../dto/telegram-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthTelegramService } from '../services/auth-telegram.service';

@ApiTags('Auth Telegram')
@ThrottleByUser({ limit: 5 })
@ThrottleByIp({ limit: 5 })
@Controller('auth/telegram')
export class AuthTelegramController {
    constructor(private readonly authTelegramService: AuthTelegramService) {}

    @ApiOperation({
        summary: 'Авторизация через Telegram'
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({ type: LoginResponseDto })
    @ApiErrorResponses(400, 401, 403, 500)
    async login(
        @Body() dto: TelegramAuthDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ) {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const data = await this.authTelegramService.login(dto, device.ip, request.serverSettings, request.actor);

        response.cookie('refreshToken', data.refreshToken, {
            secure: true,
            sameSite: 'none',
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7
        });

        response.cookie('accessToken', data.accessToken, {
            secure: true,
            sameSite: 'none',
            httpOnly: true,
            maxAge: 1000 * 3600
        });

        if (device.type === DeviceType.MOBILE) {
            return {
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            };
        }

        return { user: data.user };
    }

    @ApiOperation({ summary: 'Привязка Telegram к существующему аккаунту' })
    @HttpCode(HttpStatus.OK)
    @Post('link')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOkResponse()
    @ApiErrorResponses(401)
    async link(@Body() dto: TelegramLinkDto, @CurrentActor() actor: Actor, @Req() request: express.Request) {
        await this.authTelegramService.link(dto, actor, request.serverSettings);
    }

    @ApiOperation({ summary: 'Отвязать Telegram от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Telegram успешно отвязан' })
    @ApiErrorResponses(401)
    async unlink(@CurrentActor() actor: Actor) {
        await this.authTelegramService.unlink(actor);
    }
}
