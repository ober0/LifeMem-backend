import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword1!' })
    @IsString()
    oldPassword: string;

    @ApiProperty({ minLength: 8, example: 'NewPassword1!' })
    @IsString()
    @IsStrongPassword()
    newPassword: string;
}
