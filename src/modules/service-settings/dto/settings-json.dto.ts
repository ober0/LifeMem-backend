import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ServiceSettingsJsonDto {
    @ApiProperty()
    @IsNumber()
    appVersion: number;
}
