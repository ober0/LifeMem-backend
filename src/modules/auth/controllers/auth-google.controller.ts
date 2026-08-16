import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import express from 'express';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { GoogleAuthDto, GoogleLinkDto } from '../dto/google-auth.dto';
import { LoginResponseDto } from '../dto/tokens.dto';
import { JwtAuthGuardHttp } from '../../../common/guards/auth.guard';
import { AuthGoogleService } from '../services/auth-google.service';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Actor } from '../../../common/classes/actor';

@ApiTags('Auth Google')
@Controller('auth/google')
export class AuthGoogleController {
    constructor(private readonly authGoogleService: AuthGoogleService) {}

    @ApiOperation({
        summary: 'Авторизация через Google'
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({ type: LoginResponseDto })
    @ApiErrorResponses()
    async login(
        @Body() _dto: GoogleAuthDto,
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
        // const data = await this.authGoogleService.login(dto, ip);
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
        // if (device.type === 'mobile') {
        //     res = {
        //         ...res,
        //         accessToken: data.accessToken,
        //         refreshToken: data.refreshToken
        //     };
        // }
        //
        // return res;
    }

    @ApiOperation({ summary: 'Привязка Google к существующему аккаунту' })
    @HttpCode(HttpStatus.OK)
    @Post('link')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse()
    @ApiErrorResponses()
    async link(@Body() _dto: GoogleLinkDto, @CurrentActor() _actor: Actor) {
        // FIXME
        return {
            alert: true,
            message: 'В разработке'
        };
        // await this.authGoogleService.link(dto, actor);
    }

    @ApiOperation({ summary: 'Отвязать Google от аккаунта' })
    @HttpCode(HttpStatus.OK)
    @Post('unlink')
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Google успешно отвязан' })
    @ApiErrorResponses()
    async unlink(@CurrentActor() _actor: Actor) {
        // FIXME
        return {
            alert: true,
            message: 'В разработке'
        };
        // await this.authGoogleService.unlink(actor);
    }
}
