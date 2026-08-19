import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class UserDto extends BaseEntity {
    @ApiProperty()
    @IsString()
    nickname: string;

    @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
    @IsOptional()
    @IsUUID()
    passwordId: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsOptional()
    @IsEmail()
    email: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
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
}
