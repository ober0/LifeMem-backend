import { tool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { apiError } from '../../../../common/helpers/errors';
import type { AiToolContext } from '../../ai.types';
import type { AiToolFactory } from '../ai-tool.factory';
import { AiToolKey } from '../ai-tool-key.enum';
import { UserEntitiesSearchRepository } from '../user-entities-search.repository';

@Injectable()
export class SearchPlacesFactory implements AiToolFactory {
    readonly key = AiToolKey.SearchPlaces;

    constructor(private readonly repository: UserEntitiesSearchRepository) {}

    create(context?: AiToolContext) {
        const userId = context?.userId;
        if (!userId) {
            throw apiError.badRequest('ai.tool_context_required', { tool: this.key });
        }

        return tool(
            async ({ queries }) => {
                const rows = await this.repository.searchPlaces(userId, queries);
                return JSON.stringify({
                    queries,
                    items: rows.map((row) => ({
                        id: row.id,
                        name: row.name,
                        fullName: row.fullName
                    }))
                });
            },
            {
                name: AiToolKey.SearchPlaces,
                description:
                    'Search places already saved for the current user. Pass one or many place name fragments at once, e.g. ["Москва", "Питер"]. Returns all matches for all queries (case-insensitive contains on name/fullName).',
                schema: z.object({
                    queries: z
                        .array(z.string().min(1))
                        .min(1)
                        .describe('One or more place name fragments to search, e.g. ["Москва", "Зарядье"]')
                })
            }
        );
    }
}
