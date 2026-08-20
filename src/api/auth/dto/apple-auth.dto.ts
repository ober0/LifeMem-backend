import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateUserSettings } from '../../user/dto/create-user.dto';
import { OAuthTokenDto } from './oauth.dto';

export class AppleAuthDto extends OAuthTokenDto {
    @ApiProperty({ required: true })
    @IsString()
    nickname: string;

    @ApiProperty({ type: CreateUserSettings })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateUserSettings)
    initSettings?: CreateUserSettings;
}

export class AppleLinkAuthDto extends OAuthTokenDto {}
