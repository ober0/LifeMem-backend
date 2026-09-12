import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export class PlaceDto extends BaseEntity {
    @ApiProperty()
    name: string;

    @ApiProperty({ type: String, nullable: true })
    fullName: string | null;

    @ApiProperty({ type: Number, nullable: true })
    latitude: number | null;

    @ApiProperty({ type: Number, nullable: true })
    longitude: number | null;

    @ApiProperty()
    autodetected: boolean;
}

export class PlaceListResponseDto {
    @ApiProperty({ type: PlaceDto, isArray: true })
    data: PlaceDto[];

    @ApiProperty()
    count: number;
}
