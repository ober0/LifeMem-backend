import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested
} from 'class-validator';

import { appConstants } from '../../../common/config/app.constants';

export class EntryLocationDto {
    @ApiPropertyOptional({ example: 55.7539 })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({ example: 37.6208 })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({ example: 'Парк Горького' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    locationLabel?: string;
}

export class CreateEntryMediaItemDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4')
    id: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;
}

export class CreateEntryDto {
    @ApiPropertyOptional({ description: 'Название заметки', example: 'Прогулка в парке' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    @ApiPropertyOptional({
        description: 'Текст заметки'
    })
    @IsOptional()
    @IsString()
    @MaxLength(20000)
    text?: string;

    @ApiPropertyOptional({
        description: 'Фото и видео (id файлов после upload complete)',
        type: [CreateEntryMediaItemDto]
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPhotosPerEntry)
    @ValidateNested({ each: true })
    @Type(() => CreateEntryMediaItemDto)
    media?: CreateEntryMediaItemDto[];

    @ApiPropertyOptional({
        description: 'Голосовое сообщение',
        format: 'uuid'
    })
    @IsOptional()
    @IsUUID('4')
    audioId?: string;

    @ApiPropertyOptional({
        description: 'id связанных людей'
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    personIds?: string[];

    @ApiPropertyOptional({
        description: `id уже созданных мест. Вместе с location не больше ${appConstants.entry.maxPlacesPerEntry}`
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPlacesPerEntry)
    @IsUUID('4', { each: true })
    placeIds?: string[];

    @ApiPropertyOptional({
        description: 'Новые локации по координатам',
        type: [EntryLocationDto]
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPlacesPerEntry)
    @ValidateNested({ each: true })
    @Type(() => EntryLocationDto)
    location?: EntryLocationDto[];
}
