import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
