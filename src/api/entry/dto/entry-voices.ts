import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class EntryVoiceDto extends BaseEntity {
    @ApiProperty()
    fileId: string;

    @ApiProperty()
    url: string;
}
