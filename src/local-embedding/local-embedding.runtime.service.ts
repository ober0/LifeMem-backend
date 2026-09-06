import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { FeatureExtractionPipeline } from '@xenova/transformers';

import {
    getLocalEmbeddingModelConfig,
    isLocalEmbeddingModelName,
    LOCAL_EMBEDDING_MODEL_NAMES,
    type LocalEmbeddingModelName,
    assertLocalEmbeddingDims,
    withLocalEmbeddingPrefix
} from '../common/config/constants/local-embedding.constants';
import { apiError } from '../common/helpers/errors';

type TransformersPipeline = (
    task: 'feature-extraction',
    model: string
) => Promise<FeatureExtractionPipeline>;

@Injectable()
export class LocalEmbeddingRuntimeService implements OnModuleDestroy {
    private readonly logger = new Logger(LocalEmbeddingRuntimeService.name);
    private readonly models = new Map<LocalEmbeddingModelName, FeatureExtractionPipeline>();
    private readonly loading = new Map<LocalEmbeddingModelName, Promise<void>>();
    private pipelineFn: TransformersPipeline | null = null;

    async onModuleDestroy(): Promise<void> {
        this.models.clear();
        this.loading.clear();
    }

    private async getPipelineFn(): Promise<TransformersPipeline> {
        if (!this.pipelineFn) {
            const { pipeline } = await import('@xenova/transformers');
            this.pipelineFn = pipeline as TransformersPipeline;
        }

        return this.pipelineFn;
    }

    async loadModel(modelName: string): Promise<void> {
        if (!isLocalEmbeddingModelName(modelName)) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: modelName });
        }

        if (this.models.has(modelName)) {
            return;
        }

        const pending = this.loading.get(modelName);
        if (pending) {
            await pending;
            return;
        }

        const config = getLocalEmbeddingModelConfig(modelName)!;
        const loadPromise = (async () => {
            this.logger.log(`loading embedding model ${modelName}`);
            const pipeline = await this.getPipelineFn();
            const extract = await pipeline('feature-extraction', config.hf);
            this.models.set(modelName, extract);
            this.logger.log(`loaded ${modelName}`);
        })();

        this.loading.set(modelName, loadPromise);

        try {
            await loadPromise;
        } finally {
            this.loading.delete(modelName);
        }
    }

    async unloadModel(modelName: string): Promise<void> {
        if (!isLocalEmbeddingModelName(modelName)) {
            return;
        }

        this.models.delete(modelName);
        this.logger.log(`unloaded local embedding model ${modelName}`);
    }

    async syncLoadedModels(neededNames: string[]): Promise<void> {
        const needed = new Set(
            neededNames.filter((name): name is LocalEmbeddingModelName => isLocalEmbeddingModelName(name))
        );

        for (const name of LOCAL_EMBEDDING_MODEL_NAMES) {
            if (needed.has(name)) {
                await this.loadModel(name);
            } else if (this.models.has(name)) {
                await this.unloadModel(name);
            }
        }
    }

    async embed(params: {
        modelName: string;
        text: string;
        kind?: 'query' | 'passage';
    }): Promise<{ embedding: number[]; dims: number }> {
        if (!isLocalEmbeddingModelName(params.modelName)) {
            throw apiError.badRequest('ai.unexpected_model_type', { name: params.modelName });
        }

        if (!this.models.has(params.modelName)) {
            await this.loadModel(params.modelName);
        }

        const extract = this.models.get(params.modelName);
        if (!extract) {
            throw apiError.internal('ai.request_failed');
        }

        const config = getLocalEmbeddingModelConfig(params.modelName)!;
        const input = withLocalEmbeddingPrefix(params.text, params.kind ?? 'passage', config.prefix);
        const output = await extract(input, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data as ArrayLike<number>);

        return {
            embedding: assertLocalEmbeddingDims(embedding, config.dims),
            dims: config.dims
        };
    }
}
