import { ApiProperty } from '@nestjs/swagger';
import { EntryProcessingStatus } from '@prisma/client';

export class CreateEntryResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ enum: EntryProcessingStatus })
    status: EntryProcessingStatus;
}
