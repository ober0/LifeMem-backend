import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class EntryImageDto extends BaseEntity {
    @ApiProperty()
    fileId: string;

    @ApiProperty()
    description: string | null;

    @ApiProperty()
    url: string;
}
