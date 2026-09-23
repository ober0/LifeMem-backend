import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { EntryRagAskDto } from './dto/entry-rag-ask.dto';
import { EntryRagAskResponseDto } from './dto/entry-rag-response.dto';
import { EntryRagService } from './entry-rag.service';

@ApiTags('Entry')
@Controller('entry')
export class EntryRagController {
    constructor(private readonly entryRagService: EntryRagService) {}

    @Post('ask')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'вопрос по заметкам пользователя' })
    @ApiOkResponse({ type: EntryRagAskResponseDto })
    @ApiErrorResponses(400, 401)
    async ask(@CurrentActor() actor: Actor, @Body() dto: EntryRagAskDto): Promise<EntryRagAskResponseDto> {
        return this.entryRagService.ask(actor, dto);
    }
}
