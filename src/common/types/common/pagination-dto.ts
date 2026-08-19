import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Max, Min } from 'class-validator';

export class PaginationDto {
    @ApiProperty({ type: Number })
    @Min(1)
    @Max(100)
    @Type(() => Number)
    count: number;

    @ApiProperty({ type: Number })
    @Min(1)
    @Type(() => Number)
    page: number;
}
