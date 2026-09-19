import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

import { EntryMediaDto } from './entry-media.dto';
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

    @ApiProperty({ type: EntryMediaDto, isArray: true })
    @Type(() => EntryMediaDto)
    media: EntryMediaDto[];

    @ApiProperty({ type: EntryVoiceDto, nullable: true })
    @Type(() => EntryVoiceDto)
    @IsOptional()
    voice: EntryVoiceDto | null;

    @ApiProperty({ type: EntryPlacesResponse })
    @Type(() => EntryPlacesResponse)
    places: EntryPlacesResponse;
}
