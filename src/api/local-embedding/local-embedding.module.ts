import { Module } from '@nestjs/common';

import { LocalEmbeddingClient } from './local-embedding.client';

@Module({
    providers: [LocalEmbeddingClient],
    exports: [LocalEmbeddingClient]
})
export class LocalEmbeddingModule {}
