import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class EntryRagAskDto {
    @ApiProperty({
        description: 'Вопрос пользователя на любом языке'
    })
    @IsString()
    @MinLength(2)
    @MaxLength(2000)
    question: string;
}
