import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EntryRagSourceDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ description: 'Первые 100 символов текста заметки с … в конце', nullable: true })
    textSnippet: string | null;

    @ApiProperty()
    mediaCount: number;

    @ApiProperty()
    isHasVoice: boolean;

    @ApiProperty()
    peopleCount: number;

    @ApiProperty()
    placesCount: number;
}

export class EntryRagAskResponseDto {
    @ApiProperty({ description: 'Ответ модели на языке вопроса' })
    answer: string;

    @ApiProperty({ type: EntryRagSourceDto, isArray: true })
    @Type(() => EntryRagSourceDto)
    sources: EntryRagSourceDto[];
}
