import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ConfirmPhoneDto {
    @ApiProperty({ example: '89261483460' })
    @IsString()
    phone: string;

    @ApiProperty({ example: '123456', description: '6-значный код из SMS' })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/)
    code: string;
}
