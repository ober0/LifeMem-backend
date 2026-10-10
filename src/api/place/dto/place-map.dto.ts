import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { NumberMinMaxFilterDto } from '../../../common/types/search/min-max.filter.dto';

export class PlaceMapRequestDto {
    @ApiPropertyOptional({ type: NumberMinMaxFilterDto, description: 'Диапазон широты' })
    @IsOptional()
    @ValidateNested()
    @Type(() => NumberMinMaxFilterDto)
    latitude?: NumberMinMaxFilterDto;

    @ApiPropertyOptional({ type: NumberMinMaxFilterDto, description: 'Диапазон долготы' })
    @IsOptional()
    @ValidateNested()
    @Type(() => NumberMinMaxFilterDto)
    longitude?: NumberMinMaxFilterDto;

    @ApiPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    countries?: string[];

    @ApiPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    regions?: string[];

    @ApiPropertyOptional({ type: String, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    cities?: string[];
}

export class PlaceMapEntryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;
}

export class PlaceMapItemDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ type: String, nullable: true })
    fullName: string | null;

    @ApiProperty()
    latitude: number;

    @ApiProperty()
    longitude: number;

    @ApiProperty({ type: PlaceMapEntryDto, isArray: true })
    entries: PlaceMapEntryDto[];
}

export class PlaceMapResponseDto {
    @ApiProperty({ type: PlaceMapItemDto, isArray: true })
    data: PlaceMapItemDto[];
}

export class PlaceMapCountryDto {
    @ApiProperty()
    code: string;

    @ApiProperty()
    name: string;
}

export class PlaceMapFiltersDto {
    @ApiProperty({ type: PlaceMapCountryDto, isArray: true })
    countries: PlaceMapCountryDto[];

    @ApiProperty({ type: String, isArray: true })
    regions: string[];

    @ApiProperty({ type: String, isArray: true })
    cities: string[];
}
