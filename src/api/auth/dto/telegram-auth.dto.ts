import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

import { CreateUserSettings } from '../../user/dto/create-user.dto';

export class TelegramLoginDataDto {
    @ApiProperty({ example: 123456789 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;

    @ApiProperty({ example: 'Ivan' })
    @IsString()
    first_name: string;

    @ApiPropertyOptional({ example: 'Ivanov' })
    @IsOptional()
    @IsString()
    last_name?: string;

    @ApiPropertyOptional({ example: 'ivan' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    photo_url?: string;

    @ApiProperty({ example: 1710000000 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    auth_date: number;

    @ApiProperty()
    @IsString()
    hash: string;
}

export class TelegramAuthDto {
    @ApiProperty({ type: TelegramLoginDataDto })
    @ValidateNested()
    @Type(() => TelegramLoginDataDto)
    telegramData: TelegramLoginDataDto;

    @ApiProperty()
    @IsString()
    nickname: string;

    @ApiPropertyOptional({ type: CreateUserSettings })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateUserSettings)
    initSettings?: CreateUserSettings;
}

export class TelegramLinkDto {
    @ApiProperty({ type: TelegramLoginDataDto })
    @ValidateNested()
    @Type(() => TelegramLoginDataDto)
    telegramData: TelegramLoginDataDto;
}
