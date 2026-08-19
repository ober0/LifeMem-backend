import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber,IsOptional } from 'class-validator';

export class NumberMinMaxFilterDto {
    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    min?: number;

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    max?: number;
}

export class DateMinMaxFilterDto {
    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @Type(() => Date)
    from?: Date;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    @Type(() => Date)
    to?: Date;
}
