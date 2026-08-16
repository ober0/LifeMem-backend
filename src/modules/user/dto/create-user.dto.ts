import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OAuthProvider } from '@prisma/client';
import { IsEmail, IsOptional, IsString, IsStrongPassword, MinLength, ValidateIf } from 'class-validator';

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
}

export interface OauthCreateUser {
    nickname: string;
    provider: OAuthProvider;
    providerUserId: string;
    providerEmail?: string;
    providerUsername?: string;
    providerAvatarUrl?: string;
}
