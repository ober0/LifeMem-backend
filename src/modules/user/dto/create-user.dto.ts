import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { OAuthProvider } from '@prisma/client';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsStrongPassword,
    MinLength,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import { UserSettingsDto } from '../../user-settings/dto/user-settings.dto';
import { Type } from 'class-transformer';

export class CreateUserSettings extends PartialType(PickType(UserSettingsDto, ['lang'])) {}

export class CreateUserDto {
    @ApiProperty({ example: 'alex' })
    @IsString()
    @MinLength(2)
    nickname: string;

    @ApiPropertyOptional({ example: 'alex@lifemem.local' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ minLength: 8, example: 'password1' })
    @ValidateIf((o: CreateUserDto) => Boolean(o.email))
    @IsString()
    @IsStrongPassword()
    password?: string;

    @ApiPropertyOptional({ example: '+79991234567' })
    @IsOptional()
    // не юзать IsPhone так как не маппит 8800
    @IsString()
    phoneNumber?: string;

    @ApiProperty({ type: CreateUserSettings })
    @ValidateNested()
    @Type(() => CreateUserSettings)
    initSettings: CreateUserSettings;
}

export interface OauthCreateUser {
    nickname: string;
    provider: OAuthProvider;
    providerUserId: string;
    providerEmail?: string;
    providerUsername?: string;
    providerAvatarUrl?: string;
}
