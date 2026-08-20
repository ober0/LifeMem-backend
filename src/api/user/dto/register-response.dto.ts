import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

import { UserDto } from './user.dto';

export class RegisterResponseDto {
    @ApiProperty({ type: UserDto })
    @ValidateNested()
    @Type(() => UserDto)
    user: UserDto;

    @ApiProperty()
    @IsString()
    message: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    alert: true;
}
