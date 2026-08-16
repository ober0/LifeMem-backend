import { OAuthTokenDto } from './oauth.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleAuthDto extends OAuthTokenDto {
    @ApiProperty()
    @IsString()
    nickname: string;
}
export class GoogleLinkDto extends OAuthTokenDto {}
