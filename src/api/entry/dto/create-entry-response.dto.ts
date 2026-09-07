import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { EntryImageDto } from './entry-images';
import { EntryVoiceDto } from './entry-voices';

export class EntryPlacesResponse {
    @ApiProperty()
    ready: number;

    @ApiProperty()
    processing: number;
}

export class CreateEntryResponseDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ type: EntryImageDto, isArray: true })
    @Type(() => EntryImageDto)
    images: EntryImageDto[];

    @ApiProperty({ type: EntryVoiceDto, nullable: true })
    @Type(() => EntryVoiceDto)
    @IsOptional()
    voice: EntryVoiceDto | null;

    @ApiProperty({ type: EntryPlacesResponse })
    @Type(() => EntryPlacesResponse)
    places: EntryPlacesResponse;
}
