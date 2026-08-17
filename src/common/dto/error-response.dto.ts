import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ErrorDto {
    @ApiProperty({ example: 'error.auth.aboba' })
    code: string;

    @ApiProperty({ example: 'Супер сложная ошибка' })
    msg: string;

    @ApiProperty({ required: false, description: 'Исходная ошибка валидации (для отладки)' })
    @IsOptional()
    meta?: string;
}

export class ErrorResponseDto {
    @ApiProperty({ example: 1710000000000 })
    timestamp: number;

    @ApiProperty({ example: '/api/v1/get-more-money-pzh' })
    path: string;

    @ApiProperty({ type: ErrorDto, isArray: true })
    @ValidateNested()
    @Type(() => ErrorDto)
    errors: ErrorDto;
}
