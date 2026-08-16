import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { OAuthTokenDto } from './oauth.dto';

export class AppleAuthDto extends OAuthTokenDto {
    @ApiProperty({ required: true })
    @IsString()
    nickname: string;
}

export class AppleLinkAuthDto extends OAuthTokenDto {}
