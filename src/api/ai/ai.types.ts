import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { StructuredOutputParser } from '@langchain/core/output_parsers';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { z } from 'zod';

import { AiProvider } from '../../common/types/ai/ai-provider.enum';
import type { AiToolKey } from './tools/ai-tool-key.enum';

export type AiTokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    price?: number;
    provider?: AiProvider;
    timeMs?: number;
};

export const AI_USAGE_ERROR_KEY = 'aiUsage' as const;

export type ErrorWithAiUsage = Error & {
    [AI_USAGE_ERROR_KEY]?: AiTokenUsage;
};

export function attachAiUsage(error: unknown, usage: AiTokenUsage): never {
    if (error instanceof Error) {
        (error as ErrorWithAiUsage)[AI_USAGE_ERROR_KEY] = usage;
        throw error;
    }

    const wrapped = new Error(typeof error === 'string' ? error : 'Unknown AI error') as ErrorWithAiUsage;
    wrapped[AI_USAGE_ERROR_KEY] = usage;
    throw wrapped;
}

export function getAiUsageFromError(error: unknown): AiTokenUsage | undefined {
    if (!error || typeof error !== 'object') {
        return undefined;
    }

    const usage = (error as ErrorWithAiUsage)[AI_USAGE_ERROR_KEY];
    if (!usage) {
        return undefined;
    }

    if (usage.inputTokens > 0 || usage.outputTokens > 0 || usage.totalTokens > 0 || usage.price) {
        return usage;
    }

    return undefined;
}

export type AiInvokeResult<T> = {
    result: T;
    usage: AiTokenUsage;
    timeMs?: number;
};

export type AiRequestAccepted = {
    requestId: string;
};

export type AiRequestLookupResult<T> =
    | { status: 'pending' }
    | { status: 'ready'; result: T; usage: AiTokenUsage; timeMs: number }
    | { status: 'failed'; error: string };

export type AiToolContext = {
    userId: string;
};

export type AiStructuredParser = StructuredOutputParser<z.ZodObject<any>>;

type AiInvokeBase = {
    modelId: string;
    input: BaseLanguageModelInput;
    reasoning?: boolean;
};

export type AiInvokeParams =
    | (AiInvokeBase & {
          parser: AiStructuredParser;
          instruction: string;
      })
    | AiInvokeBase;

type AiInvokeWithToolsBase = {
    modelId: string;
    input: BaseLanguageModelInput;
    tools?: AiToolKey[];
    additionalTools?: StructuredToolInterface[];
    toolContext?: AiToolContext;
    maxSteps?: number;
    reasoning?: boolean;
};

export type AiInvokeWithToolsParams =
    | (AiInvokeWithToolsBase & {
          parser: AiStructuredParser;
          instruction: string;
      })
    | AiInvokeWithToolsBase;

export type AiEmbedParams = {
    modelId: string;
    text: string;
};

export type AiTranscribeParams = {
    modelId: string;
    audio: Buffer;
    filename?: string;
    mimeType?: string;
    language?: string;
};
