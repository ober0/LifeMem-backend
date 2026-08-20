import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({ required: false, example: 'user@gmail.com', description: 'Вместе с password' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ required: false, description: 'Вместе с email' })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiProperty({ required: false, example: '89261483460', description: 'Отдельный способ входа (SMS-код)' })
    @IsOptional()
    @IsString()
    phone?: string;
}
