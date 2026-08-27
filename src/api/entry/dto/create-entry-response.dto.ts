import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { EntryImageDto } from './entry-images';

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

    @ApiProperty({ type: EntryPlacesResponse })
    @Type(() => EntryPlacesResponse)
    places: EntryPlacesResponse;
}
