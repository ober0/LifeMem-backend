import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ example: 1710000000000 })
    timestamp: number;

    @ApiProperty({ example: '/api/v1/get-more-money-pzh' })
    path: string;

    @ApiProperty({ example: 'error.auth.aboba' })
    code: string;

    @ApiProperty({ example: 'Супер сложная ошибка' })
    msg: string;
}
