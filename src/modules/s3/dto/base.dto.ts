import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '../../../common/types/common/common-entity.dto';

export enum FileType {
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    OTHER = 'OTHER'
}

export enum MemeType {
    JPEG = 'JPEG',
    PNG = 'PNG',
    WEBP = 'WEBP',
    OTHER = 'OTHER'
}

export class FileBaseDto extends BaseEntity {
    @ApiProperty()
    @IsEnum(FileType)
    type: FileType;

    @ApiProperty({ type: String })
    @IsOptional()
    @IsString()
    fileName?: string | null;

    @ApiProperty()
    @IsEnum(MemeType)
    memeType: MemeType;

    @ApiProperty()
    @IsNumber()
    sizeBite: number;

    @ApiProperty()
    @IsString()
    path: string;
}
