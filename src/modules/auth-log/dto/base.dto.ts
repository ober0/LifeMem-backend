import { ApiProperty, PickType } from '@nestjs/swagger';
import { AuthType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { BaseEntity } from '../../../common/types/common-entity.dto';
import { CommonSearchResponseDto } from '../../../common/types/search/search-response.dto';
import { UserDto } from '../../../common/types/user';

class AuthLogUserDto extends PickType(UserDto, ['id', 'nickname', 'phoneNumber', 'email']) {}

export class AuthLogBaseDto extends BaseEntity {
    @ApiProperty({ enum: AuthType })
    @IsEnum(AuthType)
    type: AuthType;

    @ApiProperty()
    @IsString()
    ip: string;

    @ApiProperty()
    @IsUUID()
    userId: string;

    @ApiProperty({ required: false, type: AuthLogUserDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => AuthLogUserDto)
    user?: AuthLogUserDto;
}

export class AuthLogSearchResponseDto extends CommonSearchResponseDto(AuthLogBaseDto) {}
