import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { AppleAuthDto, AppleLinkAuthDto } from '../dto/apple-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { JwtAuthGuardHttp } from '../../../common/guards/auth.guard';
import { AuthAppleService } from '../services/auth-apple.service';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Actor } from '../../../common/classes/actor';

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
    @ApiErrorResponses()
    async login(
        @Body() _dto: AppleAuthDto,
        @Req() _request: express.Request,
        @Res({ passthrough: true }) _response: express.Response
    ) {
        // FIXME
        return {
            alert: true,
            message: 'В разработке'
        };

        // const device = request.actor.device;
        //
        // if (!device) {
        //     throw new InternalServerErrorException('error.auth.device_context_missing');
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
    @ApiErrorResponses()
    async link(@Body() _dto: AppleLinkAuthDto, @CurrentActor() _actor: Actor) {
        // FIXME
        return {
            alert: true,
            message: 'В разработке'
        };
        // await this.authAppleService.link(dto, actor);
    }

    @ApiOperation({ summary: 'Отвязать Apple от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiErrorResponses()
    async unlink(@CurrentActor() _actor: Actor) {
        // FIXME
        return {
            alert: true,
            message: 'В разработке'
        };
        // await this.authAppleService.unlink(actor);
    }
}
