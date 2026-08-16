import { ApiProperty } from '@nestjs/swagger';
import { AuthType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Contains } from '../../../common/helpers/contains.decorator';
import { GenerateSearchDto } from '../../../common/types/search/base-search.dto';
import { SortTypes } from '../../../common/types/search/sort-types.dto';

export class AuthLogFilterDto {
    @ApiProperty({ required: false, type: String })
    @IsOptional()
    @IsUUID()
    @Contains()
    userId?: string;

    @ApiProperty({ required: false, enum: AuthType })
    @IsOptional()
    @IsEnum(AuthType)
    @Contains()
    type?: AuthType;
}

export class AuthLogSortDto {
    @ApiProperty({ enum: SortTypes, required: false })
    @IsOptional()
    @IsEnum(SortTypes)
    createdAt?: SortTypes;
}

export class AuthLogSearchDto extends GenerateSearchDto(AuthLogFilterDto, AuthLogSortDto) {}
