import { ApiProperty, PartialType } from '@nestjs/swagger';
import type { JsonValue } from '@prisma/client/runtime/library';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsUUID, ValidateNested } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';
import { LangEnum } from '../../../common/types/common/lang.enum';

export class UserSettingsDto {
    @ApiProperty()
    @IsBoolean()
    enableNotification: boolean;

    @ApiProperty()
    @IsEnum(LangEnum)
    lang: LangEnum;
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

export class UserSettingsUpdateDto extends PartialType(UserSettingsDto) {}
