import { ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/wasm-compiler-edge';
import { ServiceSettingsJsonDto } from './settings-json.dto';
import { Type } from 'class-transformer';
import { BaseEntity } from '../../../common/types/common-entity.dto';

export class ServiceSettingsDto extends BaseEntity {
    @ApiProperty({ type: ServiceSettingsJsonDto })
    @ValidateNested()
    @Type(() => ServiceSettingsJsonDto)
    json: ServiceSettingsJsonDto | JsonValue;
}
