import { BaseEntity } from '../../../common/types/common-entity.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class RoleDto extends BaseEntity {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsBoolean()
    isDefault: boolean;
}
