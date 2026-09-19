import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AttachEntryImageDto {
    @ApiProperty({ format: 'uuid' })
    @IsUUID('4')
    fileId: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    description?: string | null;
}
