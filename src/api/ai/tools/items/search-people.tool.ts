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
            async ({ query }) => {
                const items = await this.repository.searchPeople(userId, query);
                return JSON.stringify({ items });
            },
            {
                name: AiToolKey.SearchPeople,
                description:
                    "Search people already saved for the current user by name fragment. Search like { contains: query, mode: 'insensitive' }",
                schema: z.object({
                    query: z.string().min(1).describe('Name fragment to search')
                })
            }
        );
    }
}
