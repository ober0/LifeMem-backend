import { ApiProperty } from '@nestjs/swagger';
import { EntryProcessingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

import { EntryRelations } from './base';
import { EntryImageDto } from './entry-images';

export class CreateEntryResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ enum: EntryProcessingStatus })
    status: EntryProcessingStatus;

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
