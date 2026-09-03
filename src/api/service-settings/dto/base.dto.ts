import { ApiProperty, PartialType } from '@nestjs/swagger';
import type { JsonValue } from '@prisma/client/runtime/wasm-compiler-edge';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { ServiceSettingsJsonDto } from './settings-json.dto';

export class ServiceSettingsDto extends BaseEntity {
    @ApiProperty({ type: ServiceSettingsJsonDto })
    @ValidateNested()
    @Type(() => ServiceSettingsJsonDto)
    json: ServiceSettingsJsonDto | JsonValue;
}

export class ServiceSettingsResponseDto extends PartialType(BaseEntity) {
    @ApiProperty({ type: PartialType(ServiceSettingsJsonDto) })
    @ValidateNested()
    @Type(() => ServiceSettingsJsonDto)
    json: Partial<ServiceSettingsJsonDto>;
}
