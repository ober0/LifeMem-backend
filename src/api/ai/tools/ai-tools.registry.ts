import type { StructuredToolInterface } from '@langchain/core/tools';
import { Injectable } from '@nestjs/common';

import { apiError } from '../../../common/helpers/errors';
import type { AiToolFactory } from './ai-tool.factory';
import { AiToolKey } from './ai-tool-key.enum';
import { TestFactory } from './items/test.tool';

@Injectable()
export class AiToolsRegistry {
    private readonly factories: Map<AiToolKey, AiToolFactory>;

    constructor(test: TestFactory) {
        this.factories = new Map<AiToolKey, AiToolFactory>([[test.key, test]]);
    }

    resolve(keys: AiToolKey[]): StructuredToolInterface[] {
        const uniqueKeys = [...new Set(keys)];

        return uniqueKeys.map((key) => {
            const factory = this.factories.get(key);
            if (!factory) {
                throw apiError.badRequest('ai.unknown_tool', { tool: key });
            }

            return factory.create();
        });
    }
}
