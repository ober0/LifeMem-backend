import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type express from 'express';

import type { Actor } from '../../../common/classes/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { ThrottleByIp, ThrottleByUser } from '../../../common/decorators/throttle-by-user.decorator';
import { JwtAuthGuardHttp } from '../../../common/guards/auth.guard';
import { apiError } from '../../../common/helpers/errors';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { translations } from '../../../common/translation/text-translations';
import { GoogleAuthDto, GoogleLinkDto } from '../dto/google-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthGoogleService } from '../services/auth-google.service';

@ApiTags('Auth Google')
@ThrottleByUser({ limit: 10 })
@ThrottleByIp({ limit: 10 })
@Controller('auth/google')
export class AuthGoogleController {
    constructor(private readonly authGoogleService: AuthGoogleService) {}

    @ApiOperation({
        summary: 'Авторизация через Google'
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({ type: LoginResponseDto })
    async login(
        @Body() dto: GoogleAuthDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ) {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const ip = device.ip;
        const data = await this.authGoogleService.login(dto, ip);

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

        if (device.type === 'mobile') {
            res = {
                ...res,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            };
        }

        return res;
    }

    @ApiOperation({ summary: 'Привязка Google к существующему аккаунту' })
    @HttpCode(HttpStatus.OK)
    @Post('link')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse()
    @ApiErrorResponses(401)
    async link(@Body() dto: GoogleLinkDto, @CurrentActor() actor: Actor) {
        await this.authGoogleService.link(dto, actor);
    }

    @ApiOperation({ summary: 'Отвязать Google от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Google успешно отвязан' })
    @ApiErrorResponses(401)
    async unlink(@CurrentActor() actor: Actor) {
        await this.authGoogleService.unlink(actor);
    }
}
