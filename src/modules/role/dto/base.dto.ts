import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class RoleDto extends BaseEntity {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsBoolean()
    isDefault: boolean;
}
