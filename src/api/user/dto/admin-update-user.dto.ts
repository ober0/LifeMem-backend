import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AdminUpdateUserDto {
    @ApiPropertyOptional({ example: 'alex' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    nickname?: string;

    @ApiPropertyOptional({ example: 'alex@lifemem.local', nullable: true, type: String })
    @IsOptional()
    @IsEmail()
    email?: string | null;

    @ApiPropertyOptional({ example: '+79991234567', nullable: true, type: String })
    @IsOptional()
    @IsString()
    phoneNumber?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsBoolean()
    isEmailVerified?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
    @IsBoolean()
    isPhoneVerified?: boolean;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID()
    roleId?: string;
}
