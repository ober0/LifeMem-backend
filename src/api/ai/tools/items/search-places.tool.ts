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
            async ({ query }) => {
                const rows = await this.repository.searchPlaces(userId, query);
                return JSON.stringify({
                    items: rows.map((row) => ({
                        id: row.id,
                        name: row.name,
                        fullName: row.fullName,
                        latitude: row.latitude == null ? null : Number(row.latitude),
                        longitude: row.longitude == null ? null : Number(row.longitude)
                    }))
                });
            },
            {
                name: AiToolKey.SearchPlaces,
                description:
                    "Search places already saved for the current user by name fragment. Search like { contains: query, mode: 'insensitive' }",
                schema: z.object({
                    query: z.string().min(1).describe('Place name fragment to search')
                })
            }
        );
    }
}
