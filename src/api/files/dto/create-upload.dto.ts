import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '@prisma/client';
import { IsEnum, IsMimeType, IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { appConstants } from '../../../common/config/app.constants';

export class CreateUploadDto {
    @ApiProperty({ enum: FileType })
    @IsEnum(FileType)
    type: FileType;

    @ApiProperty()
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    filename: string;

    @ApiProperty({ description: 'Размер файла в байтах' })
    @IsNumber()
    @Min(1)
    @Max(appConstants.files.maxSizeBytes)
    size: number;

    @ApiProperty()
    @IsMimeType()
    mimeType: string;
}

export class CreateUploadResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    isMultipart: boolean;

    @ApiProperty({ required: false })
    partSizeBytes?: number;

    @ApiProperty({ required: false })
    totalParts?: number;

    @ApiProperty({ required: false })
    uploadUrl?: string;
}
