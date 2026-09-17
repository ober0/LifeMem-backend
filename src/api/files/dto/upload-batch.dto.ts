import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class UploadBatchRequestDto {
    @ApiProperty({ type: [Number], example: [1, 2, 3] })
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Min(1, { each: true })
    parts: number[];
}

export class UploadBatchPartResponseDto {
    @ApiProperty()
    partNumber: number;

    @ApiProperty()
    url: string;
}

export class UploadBatchResponseDto {
    @ApiProperty({ type: [UploadBatchPartResponseDto] })
    parts: UploadBatchPartResponseDto[];
}
