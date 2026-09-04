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
    defaultMaxToolSteps: 10,
    responseTtlMs: 3 * 60 * 1000,
    responseCleanupIntervalMs: 60 * 1000,
    resultPollIntervalMs: 5000,
    resultWaitTimeoutSec: 120
} as const;
