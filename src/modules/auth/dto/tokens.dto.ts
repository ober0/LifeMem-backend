import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { UserDto } from '../../../common/types/user';

export class GeneratedTokens {
    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}

export class AccessTokenDto {
    @ApiProperty()
    accessToken: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    refreshToken: string;
}

export class OptionalRefreshTokenDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    refreshToken?: string;
}

export class WebLoginResponseDto {
    @ApiProperty({ type: UserDto })
    @ValidateNested()
    @Type(() => UserDto)
    user: UserDto;
}

export class LoginResponseDto {
    @ApiProperty({ type: UserDto })
    @ValidateNested()
    @Type(() => UserDto)
    user: UserDto;

    @ApiProperty({ required: false, description: 'Только для mobile (x-client-type: mobile)' })
    accessToken?: string;

    @ApiProperty({ required: false, description: 'Только для mobile (x-client-type: mobile)' })
    refreshToken?: string;
}

export type LoginTokensResult = {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
};

export class LoginPhoneCodeResponseDto {
    @ApiProperty({ example: 'Код 123456 отправлен' })
    message: string;

    @ApiProperty({ example: true })
    alert: boolean;
}

export type LoginFullResponseDto = LoginTokensResult | LoginPhoneCodeResponseDto;

export class SaveTokenDto {
    userId: string;
    refreshToken: string;
    ip: string;
}

export class TokenPayload {
    @ApiProperty()
    id: string;
}
