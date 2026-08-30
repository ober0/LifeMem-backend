import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AiModelUpdateDto {
    @ApiProperty()
    @IsBoolean()
    isActive: boolean;
}
