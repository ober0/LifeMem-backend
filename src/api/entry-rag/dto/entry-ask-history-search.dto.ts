import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';

export class EntryAskHistorySortDto {
    @ApiPropertyOptional({ enum: SortTypes, default: SortTypes.ASC })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

class EntryAskHistoryFilterDto {}

export class EntryAskHistorySearchDto extends GenerateSearchDto(EntryAskHistoryFilterDto, EntryAskHistorySortDto) {}
