import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseEntity } from '../common-entity.dto';

export class UserDto extends BaseEntity {
    @ApiProperty()
    @IsString()
    nickname: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    passwordId: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsOptional()
    @IsEmail()
    email: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsOptional()
    @IsString()
    phoneNumber: string | null;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    roleId: string;
}
