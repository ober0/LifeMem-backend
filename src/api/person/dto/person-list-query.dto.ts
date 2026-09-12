import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Max, Min } from 'class-validator';

export class PersonListQueryDto {
    @ApiPropertyOptional({ description: 'Поиск по имени' })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    count?: number;
}
