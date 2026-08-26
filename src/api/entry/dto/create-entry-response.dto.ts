import { ApiProperty } from '@nestjs/swagger';
import { EntryProcessingStatus, EntryProcessingType } from '@prisma/client';
import { Type } from 'class-transformer';

import { EntryRelations } from './base';
import { EntryImageDto } from './entry-images';

export class CreateEntryJobDto {
    @ApiProperty({ enum: EntryProcessingType })
    type: EntryProcessingType;

    @ApiProperty({ enum: EntryProcessingStatus })
    status: EntryProcessingStatus;
}

export class CreateEntryResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ type: CreateEntryJobDto, isArray: true })
    @Type(() => CreateEntryJobDto)
    jobs: CreateEntryJobDto[];

    @ApiProperty({ type: EntryImageDto, isArray: true })
    @Type(() => EntryImageDto)
    images: EntryImageDto[];

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    peoples: EntryRelations[];

    @ApiProperty({ type: EntryRelations, isArray: true })
    @Type(() => EntryRelations)
    places: EntryRelations[];
}
