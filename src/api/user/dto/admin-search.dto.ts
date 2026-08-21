import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { Contains } from '../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { CommonSearchResponseDto } from '../../../common/types/search/search-response.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';
import { UserDto } from './user.dto';

export class UserAdminFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    nickname?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    isEmailVerified?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    isPhoneVerified?: boolean;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    @Contains()
    roleId?: string;
}

export class UserAdminSortDto {
    @ApiProperty({ enum: SortTypes, required: false })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class UserAdminSearchDto extends GenerateSearchDto(UserAdminFilterDto, UserAdminSortDto) {}

export class UserAdminSearchResponseDto extends CommonSearchResponseDto(UserDto) {}
