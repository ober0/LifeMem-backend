import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateNested
} from 'class-validator';

import { Contains } from '../../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../../common/types/search/base-search.dto';
import { DateMinMaxFilterDto } from '../../../../common/types/search/min-max.filter.dto';
import { SortTypes } from '../../../../common/types/search/sort-types.dto';

export enum EntrySearchContentType {
    Voice = 'voice',
    Text = 'text'
}

export class EntrySearchFilterDto {
    @ApiPropertyOptional({ description: 'Поиск по заголовку' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional({ enum: EntrySearchContentType })
    @IsOptional()
    @IsEnum(EntrySearchContentType)
    type?: EntrySearchContentType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    isReady?: boolean;

    @ApiPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    peopleIds?: string[];

    @ApiPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    placeIds?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    hasImage?: boolean;

    @ApiPropertyOptional({ type: DateMinMaxFilterDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DateMinMaxFilterDto)
    createdAt?: DateMinMaxFilterDto;
}

export class EntrySearchSortDto {
    @ApiPropertyOptional({ enum: SortTypes })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class EntrySearchDto extends GenerateSearchDto(EntrySearchFilterDto, EntrySearchSortDto) {}
