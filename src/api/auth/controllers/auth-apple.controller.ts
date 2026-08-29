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
import { AppleAuthDto, AppleLinkAuthDto } from '../dto/apple-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthAppleService } from '../services/auth-apple.service';

@ApiTags('Auth Apple')
@ThrottleByUser({ limit: 10 })
@ThrottleByIp({ limit: 10 })
@Controller('auth/apple')
export class AuthAppleController {
    constructor(private readonly authAppleService: AuthAppleService) {}

    @ApiOperation({
        summary: 'Авторизация через Apple'
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({ type: LoginResponseDto })
    async login(
        @Body() dto: AppleAuthDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ) {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const ip = device.ip;
        const data = await this.authAppleService.login(dto, ip, request.serverSettings, request.actor);

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

        let res: LoginResponseDto = {
            user: data.user
        };

        if (device.type === DeviceType.MOBILE) {
            res = {
                ...res,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            };
        }

        return res;
    }

    @ApiOperation({ summary: 'Привязка Apple к аккаунту' })
    @HttpCode(HttpStatus.OK)
    @Post('link')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse()
    @ApiErrorResponses(401)
    async link(
        @Body() dto: AppleLinkAuthDto,
        @CurrentActor() actor: Actor,
        @Req() request: express.Request
    ) {
        await this.authAppleService.link(dto, actor, request.serverSettings);
    }

    @ApiOperation({ summary: 'Отвязать Apple от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiErrorResponses(401)
    async unlink(@CurrentActor() actor: Actor) {
        await this.authAppleService.unlink(actor);
    }
}
