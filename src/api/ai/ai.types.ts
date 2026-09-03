import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';

import type { AiToolKey } from './tools/ai-tool-key.enum';

export type AiTokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type AiInvokeResult<T> = {
    result: T;
    usage: AiTokenUsage;
};

export type AiRequestAccepted = {
    requestId: string;
};

export type AiRequestLookupResult<T> =
    | { status: 'pending' }
    | { status: 'ready'; result: T; usage: AiTokenUsage }
    | { status: 'failed'; error: string };

export type AiInvokeParams = {
    modelId: string;
    input: BaseLanguageModelInput;
    schema?: Record<string, unknown>;
};

export type AiInvokeWithToolsParams = {
    modelId: string;
    input: BaseLanguageModelInput;
    tools: AiToolKey[];
    schema?: Record<string, unknown>;
    maxSteps?: number;
};
