import type { StructuredToolInterface } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';

import { apiError } from '../../../common/helpers/errors';
import type { AiToolContext } from '../ai.types';
import type { AiToolFactory } from './ai-tool.factory';
import { AiToolKey } from './ai-tool-key.enum';
import { SearchPeopleFactory } from './items/search-people.tool';
import { SearchPlacesFactory } from './items/search-places.tool';

@Injectable()
export class AiToolsRegistry {
    private readonly factories: Map<AiToolKey, AiToolFactory>;

    constructor(searchPeople: SearchPeopleFactory, searchPlaces: SearchPlacesFactory) {
        this.factories = new Map<AiToolKey, AiToolFactory>([
            [searchPeople.key, searchPeople],
            [searchPlaces.key, searchPlaces]
        ]);
    }

    resolve(keys: AiToolKey[], context?: AiToolContext): StructuredToolInterface[] {
        const uniqueKeys = [...new Set(keys)];

        return uniqueKeys.map((key) => {
            const factory = this.factories.get(key);
            if (!factory) {
                throw apiError.badRequest('ai.unknown_tool', { tool: key });
            }

            return factory.create(context);
        });
    }
}
