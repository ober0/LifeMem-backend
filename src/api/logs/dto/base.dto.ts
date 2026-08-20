import { ApiProperty, PickType } from '@nestjs/swagger';
import type { HttpMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { CommonSearchResponseDto } from '../../../common/types/search/search-response.dto';
import { UserDto } from '../../../common/types/user';

class UserLogsDto extends PickType(UserDto, ['id', 'nickname', 'phoneNumber', 'email']) {}

export class LogsBaseDto extends BaseEntity {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    method?: HttpMethod;

    @ApiProperty()
    @IsString()
    path: string;

    @ApiProperty()
    @IsNumber()
    code: number;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty({ required: false, type: UserLogsDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => UserLogsDto)
    user?: UserLogsDto | null;

    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsString()
    userId?: string | null;

    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsString()
    ip?: string | null;
}

export class LogsSearchResponseDto extends CommonSearchResponseDto(LogsBaseDto) {}

export class LogsCreateDto extends PickType(LogsBaseDto, ['ip', 'code', 'path', 'method', 'userId', 'duration']) {}
