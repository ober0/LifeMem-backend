import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import type { HttpMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { Contains } from '../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';
import { LogsBaseDto } from './base.dto';

export class LogsFilterDto extends PartialType(PickType(LogsBaseDto, ['path'])) {
    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsUUID()
    @Contains()
    userId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @Contains()
    method?: HttpMethod;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Contains()
    code?: number;
}

export class LogsSortDto {
    @ApiProperty({ enum: SortTypes })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class LogsSearchDto extends GenerateSearchDto(LogsFilterDto, LogsSortDto) {}
