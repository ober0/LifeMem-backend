import type { StructuredToolInterface } from '@langchain/core/tools';

import type { AiToolContext } from '../ai.types';
import type { AiToolKey } from './ai-tool-key.enum';

export interface AiToolFactory {
    readonly key: AiToolKey;
    create(context?: AiToolContext): StructuredToolInterface;
}
