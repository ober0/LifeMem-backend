import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { LocationDto } from './create-entry.dto';
import { EntryImageDto } from './entry-images';

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

    @ApiProperty({ type: LocationDto, required: false })
    @IsOptional()
    @Type(() => LocationDto)
    location?: LocationDto;

    @ApiProperty({ type: 'string', format: 'uuid', isArray: true, required: false })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    peoples?: string[];

    @ApiProperty({ type: 'string', format: 'uuid', isArray: true, required: false })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUUID('4', { each: true })
    places?: string[];
}

export class BaseEntryDto extends BaseEntity {
    @ApiProperty()
    title: string;

    @ApiProperty({ type: String, nullable: true })
    text: string | null;

    @ApiProperty()
    isHasVoice: boolean;

    @ApiProperty({ type: [EntryImageDto] })
    images: EntryImageDto[];

    @ApiProperty()
    isReady: boolean;

    @ApiProperty({ type: LocationDto })
    @Type(() => LocationDto)
    location: LocationDto;

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    peoples: EntryRelations[];

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    places: EntryRelations[];
}
