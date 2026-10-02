import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkEntryPlaceDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4')
    placeId: string;
}
