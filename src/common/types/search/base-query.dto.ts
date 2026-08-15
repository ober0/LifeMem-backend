import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryBaseDto {
    @ApiProperty({ type: Number })
    @IsNumber()
    page: number;

    @ApiProperty({ type: Number })
    @IsNumber()
    take: number;

    @ApiProperty({
        required: false,
        description: 'Полнотекстовый поиск'
    })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'Множественная сортировка в формате field:direction',
        example: ['createdAt:desc']
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value;
        } else {
            const splited = value.replace(/,\s+/g, ',').split(',');
            if (splited.length > 1) {
                return splited;
            }
            return [value];
        }
    })
    sort?: string[];
}
