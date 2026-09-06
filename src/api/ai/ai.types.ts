import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { StructuredOutputParser } from '@langchain/core/output_parsers';
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
    tools: AiToolKey[];
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
    text: string;
    kind?: 'query' | 'passage';
};

export type AiTranscribeParams = {
    modelId: string;
    audio: Buffer;
    filename?: string;
    mimeType?: string;
    language?: string;
};
