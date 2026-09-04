import { tool } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { apiError } from '../../../../common/helpers/errors';
import type { AiToolContext } from '../../ai.types';
import type { AiToolFactory } from '../ai-tool.factory';
import { AiToolKey } from '../ai-tool-key.enum';
import { UserEntitiesSearchRepository } from '../user-entities-search.repository';

@Injectable()
export class SearchPeopleFactory implements AiToolFactory {
    readonly key = AiToolKey.SearchPeople;

    constructor(private readonly repository: UserEntitiesSearchRepository) {}

    create(context?: AiToolContext) {
        const userId = context?.userId;
        if (!userId) {
            throw apiError.badRequest('ai.tool_context_required', { tool: this.key });
        }

        return tool(
            async ({ queries }) => {
                const items = await this.repository.searchPeople(userId, queries);
                return JSON.stringify({ queries, items });
            },
            {
                name: AiToolKey.SearchPeople,
                description:
                    'Search people already saved for the current user. Pass one or many name fragments at once, e.g. ["Даша", "мама"]. Returns all matches for all queries (case-insensitive contains).',
                schema: z.object({
                    queries: z
                        .array(z.string().min(1))
                        .min(1)
                        .describe('One or more name/role fragments to search, e.g. ["Даша", "девушка"]')
                })
            }
        );
    }
}
