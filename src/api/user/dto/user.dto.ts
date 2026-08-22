import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEmail, IsOptional, IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class UserDto extends BaseEntity {
    @ApiProperty()
    @IsString()
    nickname: string;

    @ApiPropertyOptional({ format: 'uuid', type: String })
    @IsOptional()
    @IsUUID()
    passwordId: string | null;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsEmail()
    email: string | null;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    phoneNumber: string | null;

    @ApiProperty()
    @IsBoolean()
    isEmailVerified: boolean;

    @ApiProperty()
    @IsBoolean()
    isPhoneVerified: boolean;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    roleId: string;

    @ApiProperty()
    @IsOptional()
    @IsDate()
    deletedAt?: Date | null;
}

export class UserUpdateSelfDto {
    @ApiProperty({ example: 'alex' })
    @IsString()
    @MinLength(3)
    nickname: string;
}

export class AddPhoneDto {
    @ApiProperty({ example: '+79991234567' })
    @IsString()
    phoneNumber: string;
}

export class AddEmailDto {
    @ApiProperty({ example: 'example@gmail.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    @IsStrongPassword()
    password: string;
}
