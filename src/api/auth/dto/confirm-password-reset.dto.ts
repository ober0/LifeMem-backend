import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword, Length, Matches } from 'class-validator';

export class ConfirmPasswordResetDto {
    @ApiProperty({ example: 'user@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456', description: '6-значный код из письма' })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/)
    code: string;

    @ApiProperty({ minLength: 8, example: 'NewPassword1!' })
    @IsString()
    @IsStrongPassword()
    newPassword: string;
}
