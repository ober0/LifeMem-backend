import { AiProvider } from '../../types/ai/ai-provider.enum';

export const aiConstants = {
    providers: {
        [AiProvider.Openrouter]: {
            baseURL: 'https://openrouter.ai/api/v1'
        },
        [AiProvider.Polza]: {
            baseURL: 'https://polza.ai/api/v1'
        }
    },
    defaultEmbeddingModel: 'openai/text-embedding-3-small',
    defaultMaxToolSteps: 10,
    responseTtlMs: 3 * 60 * 1000,
    responseCleanupIntervalMs: 60 * 1000,
    resultPollIntervalMs: 5000,
    resultWaitTimeoutSec: 120,
    refreshUsdMs: 60 * 60 * 1000 // 1 ч
} as const;
