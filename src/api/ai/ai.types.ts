import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { StructuredOutputParser } from '@langchain/core/output_parsers';
import type { z } from 'zod';

import type { AiToolKey } from './tools/ai-tool-key.enum';

export type AiTokenUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    price?: number;
};

export type AiInvokeResult<T> = {
    result: T;
    usage: AiTokenUsage;
};

export type AiRequestAccepted = {
    requestId: string;
};

export type AiRequestLookupResult<T> =
    { status: 'pending' } | { status: 'ready'; result: T; usage: AiTokenUsage } | { status: 'failed'; error: string };

export type AiToolContext = {
    userId: string;
};

export type AiInvokeParams = {
    modelId: string;
    input: BaseLanguageModelInput;
    schema?: Record<string, unknown>;
};

export type AiStructuredParser = StructuredOutputParser<z.ZodObject<any>>;

export type AiInvokeWithToolsParams =
    | {
          modelId: string;
          input: BaseLanguageModelInput;
          tools: AiToolKey[];
          toolContext?: AiToolContext;
          parser: AiStructuredParser;
          instruction: string;
          maxSteps?: number;
      }
    | {
          modelId: string;
          input: BaseLanguageModelInput;
          tools: AiToolKey[];
          toolContext?: AiToolContext;
          maxSteps?: number;
      };
