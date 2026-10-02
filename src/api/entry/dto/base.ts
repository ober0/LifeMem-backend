import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntryFormattedTextFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

import { appConstants } from '../../../common/config/app.constants';
import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { EntryLocationDto } from './create-entry.dto';
import { EntryMediaDto } from './entry-media.dto';

export class EntryRelations {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;
}

export class BaseEntryUpdateDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    @ApiPropertyOptional({ type: 'string', format: 'uuid', isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    peoples?: string[];

    @ApiPropertyOptional({
        type: 'string',
        format: 'uuid',
        isArray: true,
        description: `id связанных мест (не больше ${appConstants.entry.maxPlacesPerEntry})`
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPlacesPerEntry)
    @IsUUID('4', { each: true })
    places?: string[];

    @ApiPropertyOptional({ type: [EntryLocationDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPlacesPerEntry)
    @ValidateNested({ each: true })
    @Type(() => EntryLocationDto)
    location?: EntryLocationDto[];
}

export class BaseEntryDto extends BaseEntity {
    @ApiProperty()
    title: string;

    @ApiProperty({ type: String, nullable: true })
    text: string | null;

    @ApiProperty({ type: String, nullable: true })
    formattedText: string | null;

    @ApiProperty({ enum: EntryFormattedTextFormat, nullable: true })
    formattedTextFormat: EntryFormattedTextFormat | null;

    @ApiProperty()
    isHasVoice: boolean;

    @ApiProperty({ type: [EntryMediaDto], description: 'Прикреплённые фото и видео' })
    media: EntryMediaDto[];

    @ApiProperty()
    isReady: boolean;

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    peoples: EntryRelations[];

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    places: EntryRelations[];
}
