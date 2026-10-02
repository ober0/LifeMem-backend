import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntryFormattedTextFormat } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateEntryContentDto {
    @ApiPropertyOptional({ description: 'Название заметки', example: 'Прогулка в парке' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    title?: string;

    @ApiPropertyOptional({ description: 'Текст заметки' })
    @IsOptional()
    @IsString()
    @MaxLength(20000)
    text?: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(20000)
    formattedText?: string | null;

    @ApiPropertyOptional({ enum: EntryFormattedTextFormat, nullable: true })
    @ValidateIf((el) => el.formattedText != null && el.formattedText !== '')
    @IsEnum(EntryFormattedTextFormat)
    formattedTextFormat?: EntryFormattedTextFormat | null;
}
