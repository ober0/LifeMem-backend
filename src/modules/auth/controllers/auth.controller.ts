import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import express from 'express';
import { apiError } from '../../../common/errors';
import { ApiErrorResponses } from '../../../common/swagger/api-error-responses';
import { DeviceType } from '../../../common/types/user';
import { ConfirmPhoneDto } from '../dto/confirm-phone.dto';
import { LoginDto } from '../dto/login.dto';
import {
    AccessTokenDto,
    GeneratedTokens,
    LoginPhoneCodeResponseDto,
    LoginResponseDto,
    LoginTokensResult,
    OptionalRefreshTokenDto,
    WebLoginResponseDto
} from '../dto/tokens.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@ApiExtraModels(LoginResponseDto, LoginPhoneCodeResponseDto, GeneratedTokens, AccessTokenDto)
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({
        summary: 'Вход'
    })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({
        description: 'Успешно',
        schema: {
            oneOf: [
                { $ref: getSchemaPath(LoginResponseDto) },
                { $ref: getSchemaPath(WebLoginResponseDto) },
                { $ref: getSchemaPath(LoginPhoneCodeResponseDto) }
            ]
        }
    })
    @ApiErrorResponses(400, 401, 500)
    async login(
        @Body() loginDto: LoginDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ): Promise<LoginResponseDto | LoginPhoneCodeResponseDto> {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const data = await this.authService.login(loginDto, request.actor);

        if ('alert' in data) {
            return data;
        }

        return this.respondWithTokens(response, data, device.type);
    }

    @ApiOperation({
        summary: 'Подтверждение входа по телефону'
    })
    @HttpCode(HttpStatus.OK)
    @Post('confirm-phone')
    @ApiOkResponse({ type: LoginResponseDto })
    @ApiErrorResponses(400, 401, 500)
    async confirmPhone(
        @Body() dto: ConfirmPhoneDto,
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response
    ): Promise<LoginResponseDto> {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const data = await this.authService.confirmPhoneLogin(dto, device.ip);
        return this.respondWithTokens(response, data, device.type);
    }

    @ApiOperation({
        summary: 'Обновление токенов'
    })
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    @ApiOkResponse({
        schema: {
            oneOf: [{ $ref: getSchemaPath(GeneratedTokens) }, { type: 'object', properties: {} }]
        }
    })
    @ApiErrorResponses(400, 401, 500)
    async refresh(
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response,
        @Body() body: OptionalRefreshTokenDto
    ): Promise<GeneratedTokens | void> {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const refreshToken =
            device.type === DeviceType.MOBILE
                ? body?.refreshToken
                : (request.cookies['refreshToken'] as string | undefined);

        if (!refreshToken) {
            throw apiError.badRequest('auth.refresh_token_not_found');
        }

        const data = await this.authService.refresh(refreshToken, device.ip);
        this.setAuthCookies(response, data.accessToken, data.refreshToken);

        if (device.type === DeviceType.MOBILE) {
            return data;
        }
    }

    @ApiOperation({
        summary: 'Выход'
    })
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    @ApiOkResponse()
    @ApiErrorResponses(403, 500)
    async logout(
        @Req() request: express.Request,
        @Res({ passthrough: true }) response: express.Response,
        @Body() body: OptionalRefreshTokenDto
    ): Promise<void> {
        const device = request.actor.device;

        if (!device) {
            throw apiError.internal('auth.device_context_missing');
        }

        const refreshToken =
            device.type === DeviceType.MOBILE
                ? body?.refreshToken
                : (request.cookies['refreshToken'] as string | undefined);

        if (!refreshToken) {
            throw apiError.forbidden('auth.refresh_token_not_found');
        }

        response.clearCookie('refreshToken');
        response.clearCookie('accessToken');

        await this.authService.logout(refreshToken);
    }

    private respondWithTokens(
        response: express.Response,
        data: LoginTokensResult,
        deviceType: DeviceType
    ): LoginResponseDto {
        this.setAuthCookies(response, data.accessToken, data.refreshToken);

        if (deviceType === DeviceType.MOBILE) {
            return {
                user: data.user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            };
        }

        return { user: data.user };
    }

    private setAuthCookies(response: express.Response, accessToken: string, refreshToken: string): void {
        response.cookie('refreshToken', refreshToken, {
            secure: true,
            sameSite: 'none',
            httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 7
        });

        response.cookie('accessToken', accessToken, {
            secure: true,
            sameSite: 'none',
            httpOnly: true,
            maxAge: 1000 * 3600
        });
    }
}
