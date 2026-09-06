import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { appConstants } from '../common/config/app.constants';
import { LocalEmbeddingRuntimeService } from './local-embedding.runtime.service';

@Injectable()
export class LocalEmbeddingSyncService implements OnModuleInit {
    private readonly logger = new Logger(LocalEmbeddingSyncService.name);

    constructor(private readonly runtime: LocalEmbeddingRuntimeService) {}

    async onModuleInit(): Promise<void> {
        const modelName = appConstants.localEmbedding.defaultModel;
        this.logger.log(`loading default embedding model ${modelName}`);
        await this.runtime.loadModel(modelName);
    }
}
