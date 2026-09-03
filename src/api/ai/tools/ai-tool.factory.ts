import type { StructuredToolInterface } from '@langchain/core/tools';

import type { AiToolKey } from './ai-tool-key.enum';

export interface AiToolFactory {
    readonly key: AiToolKey;
    create(): StructuredToolInterface;
}
