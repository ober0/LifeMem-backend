import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export function CommonSearchResponseDto<T extends new(...args: any[]) => any>(ItemClass: T) {
    class SearchResponseDto {
        @ApiProperty({ type: ItemClass, isArray: true })
        @ValidateNested({ each: true })
        @Type(() => ItemClass)
        data: InstanceType<T>[];

        @ApiProperty()
        count: number;
    }

    return SearchResponseDto;
}
