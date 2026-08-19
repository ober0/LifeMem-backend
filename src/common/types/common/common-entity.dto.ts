import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsUUID } from 'class-validator';

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
