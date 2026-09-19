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
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    @ApiProperty({ type: 'string', format: 'uuid', isArray: true, required: false })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    peoples?: string[];

    @ApiProperty({
        type: 'string',
        format: 'uuid',
        isArray: true,
        required: false,
        description: `id связанных мест (не больше ${appConstants.entry.maxPlacesPerEntry})`,
        example: ['b2c3d4e5-f6a7-4890-b123-456789abcdef']
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(appConstants.entry.maxPlacesPerEntry)
    @IsUUID('4', { each: true })
    places?: string[];

    @ApiPropertyOptional({
        type: [EntryLocationDto]
    })
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
