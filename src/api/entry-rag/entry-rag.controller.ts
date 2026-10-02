import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { Actor } from '../../common/classes/actor';
import { CurrentActor } from '../../common/decorators/current-actor.decorator';
import { JwtAuthGuardHttp } from '../../common/guards/auth.guard';
import { ApiErrorResponses } from '../../common/swagger/api-error-responses';
import { EntryAskHistorySearchDto } from './dto/entry-ask-history-search.dto';
import { EntryAskHistorySearchResponseDto } from './dto/entry-ask-history-response.dto';
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

    @Post('ask/history')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuardHttp({}))
    @ApiOperation({ summary: 'История вопросов по заметкам' })
    @ApiOkResponse({ type: EntryAskHistorySearchResponseDto })
    @ApiErrorResponses(400, 401)
    async searchHistory(
        @CurrentActor() actor: Actor,
        @Body() dto: EntryAskHistorySearchDto
    ): Promise<EntryAskHistorySearchResponseDto> {
        return this.entryRagService.searchHistory(actor, dto);
    }
}
