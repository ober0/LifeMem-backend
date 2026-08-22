import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { parseFormDataUuidArray } from '../helpers/parse-form-data.helper';

export class LocationDto {
    latitude?: number;
    longitude?: number;
    locationLabel?: string;
}

export class CreateEntryDto {
    @ApiProperty({ description: 'Название заметки', example: 'Прогулка в парке' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    @ApiPropertyOptional({
        description: 'Текст заметки',
        example: 'Были с девушкой, солнечно, отличное настроение'
    })
    @IsOptional()
    @IsString()
    @MaxLength(20000)
    text?: string;

    @ApiPropertyOptional({
        description: 'id связанных людей (JSON-массив UUID в multipart)',
        type: 'string',
        example: '["a1b2c3d4-e5f6-4789-a012-3456789abcde"]'
    })
    @IsOptional()
    @Transform(({ value }) => parseFormDataUuidArray(value))
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    personIds?: string[];

    @ApiPropertyOptional({
        description: 'id связанных мест (JSON-массив UUID в multipart)',
        type: 'string',
        example: '["b2c3d4e5-f6a7-4890-b123-456789abcdef0"]'
    })
    @IsOptional()
    @Transform(({ value }) => parseFormDataUuidArray(value))
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    placeIds?: string[];
}
