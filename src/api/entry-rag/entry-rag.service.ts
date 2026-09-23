import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { Injectable } from '@nestjs/common';
import { AscStatus } from '@prisma/client';
import { z } from 'zod';

import type { Actor } from '../../common/classes/actor';
import { appConstants } from '../../common/config/app.constants';
import { apiError } from '../../common/helpers/errors';
import { AiService } from '../ai/ai.service';
import type { AiTokenUsage } from '../ai/ai.types';
import { getAiUsageFromError } from '../ai/ai.types';
import { AiToolKey } from '../ai/tools/ai-tool-key.enum';
import { DelayedWorkerService } from '../delayed-worker/delayed-worker.service';
import { ServiceSettingsService } from '../service-settings/service-settings.service';
import { entryRagPrompts } from './consts/prompts.const';
import type { EntryRagAskDto } from './dto/entry-rag-ask.dto';
import type { EntryRagAskResponseDto, EntryRagSourceDto } from './dto/entry-rag-response.dto';
import { type CreateAscInput, EntryRagRepository } from './entry-rag.repository';

const entryRagResultSchema = z.object({
    answer: z
        .string()
        .describe(
            'Factual answer: user always "ты" for their actions (including with others — no "они" for the same scene); other people third person; one plain paragraph, no markdown or preambles'
        ),
    sourceIds: z.array(z.uuid()).describe('Entry ids that were actually used as evidence for the answer')
});

const entryRagResultParser = StructuredOutputParser.fromZodSchema(entryRagResultSchema);
const entryRagFormatInstructions = entryRagResultParser.getFormatInstructions();

type EntryRagResult = z.infer<typeof entryRagResultSchema>;

@Injectable()
export class EntryRagService {
    constructor(
        private readonly ai: AiService,
        private readonly serviceSettings: ServiceSettingsService,
        private readonly repository: EntryRagRepository,
        private readonly delayedWorker: DelayedWorkerService
    ) {}

    async ask(actor: Actor, dto: EntryRagAskDto): Promise<EntryRagAskResponseDto> {
        const question = dto.question.trim();
        if (!question) {
            throw apiError.badRequest('entry.rag_query_required');
        }

        const userId = actor.user.id;
        const settings = await this.serviceSettings.getJsonForRequest();
        const tariff = appConstants.userSettings.defaultDevTariff;
        const modelId = settings.models.rag[tariff];

        if (!modelId) {
            throw apiError.internal('service_settings.model_not_found');
        }

        const todayIsoDate = new Date().toISOString().slice(0, 10);
        const startedAt = Date.now();

        let usage: AiTokenUsage | undefined;
        let timeMs: number | undefined;

        try {
            const invoke = await this.ai.runWithTools<EntryRagResult>({
                modelId,
                // TODO для премов можно true сделать
                reasoning: false,
                maxSteps: appConstants.ai.rag.maxToolSteps,
                tools: [AiToolKey.SearchPeople, AiToolKey.SearchPlaces, AiToolKey.SearchEntries],
                toolContext: { userId },
                parser: entryRagResultParser,
                instruction: entryRagFormatInstructions,
                input: [
                    new SystemMessage(entryRagPrompts.systemCreatedAt(todayIsoDate)),
                    new SystemMessage(entryRagPrompts.system(todayIsoDate)),
                    new SystemMessage(entryRagPrompts.toolUsage()),
                    new HumanMessage(question)
                ]
            });

            usage = invoke.usage;
            timeMs = invoke.timeMs ?? Date.now() - startedAt;

            const sourceIds = [...new Set((invoke.result.sourceIds ?? []).filter(Boolean))];
            const sources = await this.repository.findSourcesByIds(userId, sourceIds);
            const orderedSources = this.orderSources(sourceIds, sources);
            const answer = invoke.result.answer?.trim() ?? '';

            this.persistAsc({
                status: AscStatus.SUCCESS,
                userId,
                question,
                result: answer,
                sourceCount: orderedSources.length,
                timeMs,
                modelId,
                usage
            });

            return {
                answer,
                sources: orderedSources
            };
        } catch (error) {
            timeMs = Date.now() - startedAt;
            usage = getAiUsageFromError(error) ?? usage;

            this.persistAsc({
                status: AscStatus.ERROR,
                userId,
                question,
                result: error instanceof Error ? error.message : String(error),
                sourceCount: null,
                timeMs,
                modelId,
                usage
            });

            throw error;
        }
    }

    private persistAsc(data: CreateAscInput): void {
        this.delayedWorker.setImmediate(() => this.repository.createAsc(data));
    }

    private orderSources(sourceIds: string[], sources: EntryRagSourceDto[]): EntryRagSourceDto[] {
        const byId = new Map(sources.map((item) => [item.id, item]));

        return sourceIds.map((id) => byId.get(id)).filter((item): item is EntryRagSourceDto => item != null);
    }
}
