import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateUserSettings } from '../../user/dto/create-user.dto';
import { OAuthTokenDto } from './oauth.dto';

export class GoogleAuthDto extends OAuthTokenDto {
    @ApiProperty()
    @IsString()
    nickname: string;

    @ApiProperty({ type: CreateUserSettings })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateUserSettings)
    initSettings?: CreateUserSettings;
}
export class GoogleLinkDto extends OAuthTokenDto {}
