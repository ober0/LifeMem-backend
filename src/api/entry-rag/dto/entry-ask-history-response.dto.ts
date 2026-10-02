import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { EntryRagSourceDto } from './entry-rag-response.dto';

export class EntryAskHistoryItemDto {
    @ApiProperty({ format: 'uuid' })
    id: string;

    @ApiProperty({ description: 'Текст вопроса', type: String, nullable: true })
    question: string | null;

    @ApiProperty({ description: 'Ответ модели', type: String, nullable: true })
    answer: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ type: EntryRagSourceDto, isArray: true })
    @Type(() => EntryRagSourceDto)
    sources: EntryRagSourceDto[];
}

export class EntryAskHistorySearchResponseDto {
    @ApiProperty({ type: EntryAskHistoryItemDto, isArray: true })
    @Type(() => EntryAskHistoryItemDto)
    data: EntryAskHistoryItemDto[];

    @ApiProperty()
    count: number;
}
