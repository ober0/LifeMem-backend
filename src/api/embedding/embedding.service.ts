import { Injectable } from '@nestjs/common';

import { appConstants } from '../../common/config/app.constants';
import { isLocalEmbeddingModelName } from '../../common/config/constants/local-embedding.constants';
import { apiError } from '../../common/helpers/errors';
import { AiService } from '../ai/ai.service';
import { AiModelService } from '../ai-model/ai-model.service';
import { LocalEmbeddingClient } from '../local-embedding/local-embedding.client';

@Injectable()
export class EmbeddingService {
    constructor(
        private readonly aiModelService: AiModelService,
        private readonly ai: AiService,
        private readonly localEmbedding: LocalEmbeddingClient
    ) {}

    async embedText(text: string, kind: 'query' | 'passage' = 'passage') {
        const useProvider = appConstants.embedding.use;

        let modelName: string;

        if (useProvider === 'ai') {
            modelName = appConstants.ai.defaultEmbeddingModel;
        } else if (useProvider === 'local') {
            modelName = appConstants.localEmbedding.defaultModel;
        } else {
            throw apiError.notFound('ai_model.not_found');
        }

        const dbModel = await this.aiModelService.findByName(modelName);
        if (!dbModel || !dbModel.isActive) {
            throw apiError.notFound('ai_model.not_found');
        }

        if (dbModel.type !== 'Embedding') {
            throw apiError.notFound('ai_model.not_found');
        }

        if (isLocalEmbeddingModelName(dbModel.name)) {
            const embedded = await this.localEmbedding.embed({
                modelName: dbModel.name,
                text,
                kind
            });

            return {
                modelId: dbModel.id,
                result: embedded.embedding,
                usage: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0
                }
            };
        }

        const { requestId } = await this.ai.embed({
            modelId: dbModel.id,
            text
        });

        const reqResponse = await this.ai.waitResult<number[]>(requestId);

        return {
            ...reqResponse,
            modelId: dbModel.id
        };
    }
}
