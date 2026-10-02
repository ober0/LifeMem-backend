import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkEntryPersonDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4')
    personId: string;
}
