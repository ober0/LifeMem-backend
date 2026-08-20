import { ApiProperty } from '@nestjs/swagger';

import { PermissionDto, UserDto } from '../../../common/types/user';
import { RoleDto } from '../../role/dto/base.dto';

export class SelfDto {
    @ApiProperty({ type: UserDto })
    user: UserDto;

    @ApiProperty({ type: PermissionDto, isArray: true })
    permission: PermissionDto[];

    @ApiProperty({ type: RoleDto })
    role: RoleDto;
}
