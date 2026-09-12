import { ApiProperty } from '@nestjs/swagger';
import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';
import { Type } from 'class-transformer';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { EntryImageDto } from './entry-images';
import { EntryVoiceDto } from './entry-voices';

export class EntryDetailPersonDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    createdAt: Date;
}

export class EntryDetailPlaceDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    createdAt: Date;
}

export class EntryProcessingJobDto extends BaseEntity {
    @ApiProperty({ enum: EntryProcessingType })
    type: EntryProcessingType;

    @ApiProperty({ enum: EntryProcessingStatus })
    status: EntryProcessingStatus;

    @ApiProperty({ type: String, isArray: true })
    errorMessages: string[];
}

export class EntryDetailResponseDto extends BaseEntity {
    @ApiProperty({ format: 'uuid' })
    userId: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ type: String, nullable: true })
    text: string | null;

    @ApiProperty()
    isReady: boolean;

    @ApiProperty({ type: EntryVoiceDto, nullable: true })
    @Type(() => EntryVoiceDto)
    voice: EntryVoiceDto | null;

    @ApiProperty({ type: EntryImageDto, isArray: true })
    @Type(() => EntryImageDto)
    photos: EntryImageDto[];

    @ApiProperty({ type: EntryProcessingJobDto, isArray: true })
    @Type(() => EntryProcessingJobDto)
    jobs: EntryProcessingJobDto[];

    @ApiProperty({ type: EntryDetailPersonDto, isArray: true })
    @Type(() => EntryDetailPersonDto)
    people: EntryDetailPersonDto[];

    @ApiProperty({ type: EntryDetailPlaceDto, isArray: true })
    @Type(() => EntryDetailPlaceDto)
    places: EntryDetailPlaceDto[];
}
