import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AttachEntryMediaDto {
    @ApiProperty({ format: 'uuid', description: 'id файла после upload complete (IMAGE или VIDEO)' })
    @IsUUID('4')
    fileId: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string | null;
}
