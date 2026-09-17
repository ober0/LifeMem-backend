import { ApiProperty } from '@nestjs/swagger';

export class CompleteUploadResponseDto {
    @ApiProperty()
    fileId: string;

    @ApiProperty()
    status: string;
}
