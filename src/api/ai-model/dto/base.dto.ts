import { ApiProperty } from '@nestjs/swagger';
import { ModelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsString } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { CommonSearchResponseDto } from '../../../common/types/search/search-response.dto';

export class AiModelDto extends BaseEntity {
    @ApiProperty({ example: 'openai/gpt-4o-mini' })
    @IsString()
    name: string;

    @ApiProperty({ enum: ModelType })
    @IsEnum(ModelType)
    type: ModelType;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;
}

export class AiModelSearchResponseDto extends CommonSearchResponseDto(AiModelDto) {}
