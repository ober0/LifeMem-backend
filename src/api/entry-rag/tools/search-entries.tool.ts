import { tool } from '@langchain/core/tools';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';

import { appConstants } from '../../../common/config/app.constants';
import { apiError } from '../../../common/helpers/errors';
import { DateMinMaxFilterDto } from '../../../common/types/search/min-max.filter.dto';
import type { AiToolContext } from '../../ai/ai.types';
import type { AiToolFactory } from '../../ai/tools/ai-tool.factory';
import { AiToolKey } from '../../ai/tools/ai-tool-key.enum';
import { AiToolsRegistry } from '../../ai/tools/ai-tools.registry';
import { EmbeddingService } from '../../embedding/embedding.service';
import type { EntrySearchDto } from '../../entry/dto/search/search-request.dto';
import { EntryRepository } from '../../entry/entry.repository';
import { EntrySearchRepository } from '../../entry/entry-search.repository';

@Injectable()
export class SearchEntriesFactory implements AiToolFactory, OnModuleInit {
    readonly key = AiToolKey.SearchEntries;

    constructor(
        private readonly embedding: EmbeddingService,
        private readonly entrySearch: EntrySearchRepository,
        private readonly entryRepository: EntryRepository,
        private readonly toolsRegistry: AiToolsRegistry
    ) {}

    onModuleInit() {
        this.toolsRegistry.register(this);
    }

    create(context?: AiToolContext) {
        const userId = context?.userId;
        if (!userId) {
            throw apiError.badRequest('ai.tool_context_required', { tool: this.key });
        }

        const limit = appConstants.ai.rag.limitPerQuery;

        return tool(
            async ({ queries, peopleIds, placeIds, createdAt }) => {
                const uniqueQueries = [
                    ...new Set((queries ?? []).map((query) => query.trim()).filter((query) => query.length > 0))
                ].slice(0, 10);

                if (uniqueQueries.length === 0) {
                    return JSON.stringify({ queries: [], items: [], error: 'queries required' });
                }

                const filters = this.buildFilters({ peopleIds, placeIds, createdAt });
                const searchDtoBase: EntrySearchDto = {
                    pagination: { page: 1, count: limit },
                    sorts: undefined,
                    filters,
                    query: undefined
                };

                let scopedEntryIds: string[] = [];
                if (this.entryRepository.hasActiveSearchFilters(filters)) {
                    const candidates = await this.entryRepository.findSearchFilterCandidates(userId, searchDtoBase);
                    scopedEntryIds = candidates.map((row) => row.id);

                    if (scopedEntryIds.length === 0) {
                        return JSON.stringify({
                            queries: uniqueQueries,
                            filters: {
                                peopleIds: peopleIds ?? [],
                                placeIds: placeIds ?? [],
                                createdAt: createdAt ?? null
                            },
                            items: []
                        });
                    }
                }

                const batches = await Promise.all(
                    uniqueQueries.map(async (query) => {
                        const embedded = await this.embedding.embedText(query, 'query');
                        const ranked = await this.entrySearch.findRankedEntryIds(
                            userId,
                            {
                                ...searchDtoBase,
                                query
                            },
                            query,
                            embedded.result,
                            scopedEntryIds
                        );

                        if (ranked.length === 0) {
                            return [];
                        }

                        const entries = await this.entrySearch.hydrateRankedHits(userId, ranked);
                        const byId = new Map(entries.map((entry) => [entry.id, entry]));

                        return ranked.flatMap((hit) => {
                            const entry = byId.get(hit.id);
                            if (!entry) {
                                return [];
                            }

                            return [
                                {
                                    id: entry.id,
                                    title: entry.title,
                                    text: entry.text ?? entry.formattedText,
                                    mediaCount: entry._count.media,
                                    isHasVoice: entry.voice != null,
                                    peopleCount: entry._count.people,
                                    placesCount: entry._count.places,
                                    matchedQuery: query,
                                    score: hit.score,
                                    distance: hit.distance
                                }
                            ];
                        });
                    })
                );

                const byId = new Map<string, (typeof batches)[number][number]>();
                for (const item of batches.flat()) {
                    const existing = byId.get(item.id);
                    if (!existing || item.score > existing.score) {
                        byId.set(item.id, item);
                    }
                }

                const items = [...byId.values()].sort((a, b) => b.score - a.score);

                return JSON.stringify({
                    queries: uniqueQueries,
                    filters: {
                        peopleIds: peopleIds ?? [],
                        placeIds: placeIds ?? [],
                        createdAt: createdAt ?? null
                    },
                    items
                });
            },
            {
                name: AiToolKey.SearchEntries,
                description: [
                    'Semantic vector search over the current user diary notes.',
                    'Pass complementary search phrases in queries[].',
                    'Optional peopleIds / placeIds: uuid arrays from search_people / search_places (pg_trgm).',
                    'Optional createdAt: { min, max } ISO datetimes — only notes created inside that interval.',
                    'Returns score (0..1 similarity, higher is better) and distance (1-score, lower is better) for confidence.'
                ].join(' '),
                schema: z.object({
                    queries: z
                        .array(z.string().min(1))
                        .min(1)
                        .max(10)
                        .describe('One or more search phrases derived from the user question'),
                    peopleIds: z.array(z.uuid()).max(10).optional().describe('Optional person ids from search_people'),
                    placeIds: z.array(z.uuid()).max(10).optional().describe('Optional place ids from search_places'),
                    createdAt: z
                        .object({
                            min: z.string().optional().describe('Inclusive lower bound ISO datetime'),
                            max: z.string().optional().describe('Inclusive upper bound ISO datetime')
                        })
                        .optional()
                        .describe('Optional createdAt interval filter')
                })
            }
        );
    }

    private buildFilters(params: {
        peopleIds?: string[];
        placeIds?: string[];
        createdAt?: { min?: string; max?: string };
    }) {
        const peopleIds = [...new Set((params.peopleIds ?? []).filter(Boolean))];
        const placeIds = [...new Set((params.placeIds ?? []).filter(Boolean))];

        let createdAt: DateMinMaxFilterDto | undefined;
        if (params.createdAt?.min || params.createdAt?.max) {
            createdAt = new DateMinMaxFilterDto();
            if (params.createdAt.min) {
                const from = new Date(params.createdAt.min);
                if (!Number.isNaN(from.getTime())) {
                    createdAt.from = from;
                }
            }
            if (params.createdAt.max) {
                const to = new Date(params.createdAt.max);
                if (!Number.isNaN(to.getTime())) {
                    createdAt.to = to;
                }
            }
            if (!createdAt.from && !createdAt.to) {
                createdAt = undefined;
            }
        }

        if (peopleIds.length === 0 && placeIds.length === 0 && !createdAt) {
            return undefined;
        }

        return {
            ...(peopleIds.length > 0 ? { peopleIds } : {}),
            ...(placeIds.length > 0 ? { placeIds } : {}),
            ...(createdAt ? { createdAt } : {})
        };
    }
}
