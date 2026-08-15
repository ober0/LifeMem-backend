import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { JsonValue } from '@prisma/client/runtime/library';
import { BaseEntity } from '../common-entity.dto';

export class UserSettingsDto {
    @ApiProperty()
    @IsBoolean()
    enableNotification: boolean;
}

export class BaseUserSettings extends BaseEntity {
    @ApiProperty({ type: UserSettingsDto })
    @ValidateNested()
    @Type(() => UserSettingsDto)
    json: UserSettingsDto | JsonValue;

    @ApiProperty()
    @IsUUID()
    userId: string;
}
