import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Contains } from '../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';
import { LogsBaseDto } from './base.dto';
import { HttpMethod } from '@prisma/client';

export class LogsFilterDto extends PickType(LogsBaseDto, ['code', 'path']) {
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
}

export class LogsSortDto {
    @ApiProperty({ enum: SortTypes })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class LogsSearchDto extends GenerateSearchDto(LogsFilterDto, LogsSortDto) {}
