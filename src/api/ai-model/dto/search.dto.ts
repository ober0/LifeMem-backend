import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { Contains } from '../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';

export class AiModelFilterDto {
    @ApiPropertyOptional({ enum: ModelType })
    @IsOptional()
    @IsEnum(ModelType)
    @Contains()
    type?: ModelType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    @Contains()
    isActive?: boolean;
}

export class AiModelSortDto {
    @ApiProperty({ enum: SortTypes, required: false })
    @IsOptional()
    @IsEnum(SortTypes)
    name?: SortTypes;
}

export class AiModelSearchDto extends GenerateSearchDto(AiModelFilterDto, AiModelSortDto) {}
