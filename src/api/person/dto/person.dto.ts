import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class PersonDto extends BaseEntity {
    @ApiProperty()
    name: string;

    @ApiProperty()
    autodetected: boolean;
}

export class PersonListResponseDto {
    @ApiProperty({ type: PersonDto, isArray: true })
    data: PersonDto[];

    @ApiProperty()
    count: number;
}
