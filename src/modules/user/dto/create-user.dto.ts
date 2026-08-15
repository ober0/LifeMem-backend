import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'alex' })
    @IsString()
    @MinLength(2)
    nickname: string;

    @ApiPropertyOptional({ example: 'alex@lifemem.local' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ minLength: 8, example: 'password1' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiPropertyOptional({ example: '+79991234567', nullable: true })
    @IsOptional()
    @IsString()
    phoneNumber?: string | null;
}
