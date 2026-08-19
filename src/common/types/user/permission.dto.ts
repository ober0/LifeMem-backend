import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseEntity } from '../common/common-entity.dto';

export class PermissionDto extends BaseEntity {
    @ApiProperty({ example: 'users.read' })
    @IsString()
    key: string;

    @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
    @IsOptional()
    @IsUUID()
    permissionCategoryId: string | null;
}
