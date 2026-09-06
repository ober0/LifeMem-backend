import { ModelType, type PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';

import { AI_MODELS_CACHE_PATTERN } from '../../src/common/config/constants/cache.constants';

const MODELS: ReadonlyArray<{ name: string; type: ModelType }> = [
    // llm
    { name: 'openai/gpt-5.4-nano', type: ModelType.TextToText },
    { name: 'anthropic/claude-sonnet-4', type: ModelType.TextToText },
    { name: 'google/gemini-2.5-flash', type: ModelType.TextToText },
    { name: 'deepseek/deepseek-chat', type: ModelType.TextToText },

    // vision
    { name: 'google/gemini-2.5-flash-lite', type: ModelType.ImageToText },

    // stt
    { name: 'openai/whisper-large-v3-turbo', type: ModelType.SpeechToText },

    // векторы
    { name: 'openai/text-embedding-3-small', type: ModelType.Embedding },
    { name: 'local/multilingual-e5-small', type: ModelType.Embedding }
];

export async function seedAiModels(prisma: PrismaClient, redis: Redis): Promise<void> {
    for (const model of MODELS) {
        const existing = await prisma.aiModel.findFirst({ where: { name: model.name } });

        if (existing) {
            console.log(`[seed:ai-models] ${model.name} уже есть`);
            continue;
        }

        await prisma.aiModel.create({
            data: {
                name: model.name,
                type: model.type
            }
        });

        console.log(`[seed:ai-models] создана ${model.name}`);
    }

    let cursor = '0';
    do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', AI_MODELS_CACHE_PATTERN, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } while (cursor !== '0');

    console.log('[seed:ai-models] кеш сброшен');
}
