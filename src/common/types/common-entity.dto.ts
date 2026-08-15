import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseEntity {
    @ApiProperty()
    @IsUUID()
    id: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;
}
