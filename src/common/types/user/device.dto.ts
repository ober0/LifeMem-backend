import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum DeviceType {
    MOBILE = 'mobile',
    WEB = 'web'
}

export class DeviceDto {
    @ApiProperty()
    @IsString()
    ip: string;

    @ApiProperty({ enum: DeviceType, example: DeviceType.WEB })
    @IsEnum(DeviceType)
    type: DeviceType;
}
