import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EntryProcessingStatusDto {
    @ApiProperty({ example: 2 })
    done: number;

    @ApiProperty({ example: 5 })
    total: number;

    @ApiProperty({ example: 1 })
    error: number;
}

export class EntrySearchItemDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ type: String, nullable: true })
    text: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    isHasVoice: boolean;

    @ApiProperty()
    photoCount: number;

    @ApiProperty()
    isReady: boolean;

    @ApiProperty({ type: EntryProcessingStatusDto })
    @Type(() => EntryProcessingStatusDto)
    processingStatus: EntryProcessingStatusDto;

    @ApiProperty()
    peopleCount: number;

    @ApiProperty()
    placesCount: number;
}

export class EntrySearchResponseDto {
    @ApiProperty({ type: EntrySearchItemDto, isArray: true })
    @Type(() => EntrySearchItemDto)
    data: EntrySearchItemDto[];

    @ApiProperty()
    count: number;
}
