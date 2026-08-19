import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type express from 'express';

import type { Actor } from '../../../common/classes/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { translations } from '../../../common/translation/text-translations';
import type { AppleAuthDto, AppleLinkAuthDto } from '../dto/apple-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { AuthAppleService } from '../services/auth-apple.service';

@ApiTags('Auth Apple')
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
        @Body() _dto: AppleAuthDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) _response: express.Response
    ) {
        const lang = request.actor?.requestLang;
        return {
            alert: true,
            message: translations.byTextKey({ key: 'common.inDevelopment', lang })
        };

        // const device = request.actor.device;
        //
        // if (!device) {
        //     throw apiError.internal('auth.device_context_missing');
        // }
        //
        // const ip = device.ip;
        // const data = await this.authAppleService.login(dto, ip);
        //
        // response.cookie('refreshToken', data.refreshToken, {
        //     secure: true,
        //     sameSite: 'none',
        //     httpOnly: true,
        //     maxAge: 1000 * 3600 * 24 * 7
        // });
        //
        // response.cookie('accessToken', data.accessToken, {
        //     secure: true,
        //     sameSite: 'none',
        //     httpOnly: true,
        //     maxAge: 1000 * 3600
        // });
        //
        // let res: LoginResponseDto = {
        //     user: data.user
        // };
        //
        // if (device.type === DeviceType.MOBILE) {
        //     res = {
        //         ...res,
        //         accessToken: data.accessToken,
        //         refreshToken: data.refreshToken
        //     };
        // }
        //
        // return res;
    }

    @ApiOperation({ summary: 'Привязка Apple к аккаунту' })
    @HttpCode(HttpStatus.OK)
    @Post('link')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse()
    @ApiErrorResponses(401)
    async link(@Body() _dto: AppleLinkAuthDto, @CurrentActor() _actor: Actor) {
        return {
            alert: true,
            message: translations.byTextKey({ key: 'common.inDevelopment' })
        };
        // await this.authAppleService.link(dto, actor);
    }

    @ApiOperation({ summary: 'Отвязать Apple от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiErrorResponses(401)
    async unlink(@CurrentActor() _actor: Actor) {
        return {
            alert: true,
            message: translations.byTextKey({ key: 'common.inDevelopment' })
        };
        // await this.authAppleService.unlink(actor);
    }
}
