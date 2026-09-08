import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { Contains } from '../../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../../common/types/search/sort-types.dto';

export class EntrySearchFilterDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    isReady?: boolean;
}

export class EntrySearchSortDto {
    @ApiPropertyOptional({ enum: SortTypes })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class EntrySearchDto extends GenerateSearchDto(EntrySearchFilterDto, EntrySearchSortDto) {}
