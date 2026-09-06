const LOCAL_EMBEDDING_MODELS: Record<string, LocalEmbeddingModelConfig> = {
    'local/multilingual-e5-small': {
        hf: 'Xenova/multilingual-e5-small',
        prefix: 'e5' as const,
        dims: 384
    }
    // 'local/multilingual-e5-base': {
    //     hf: 'Xenova/multilingual-e5-base',
    //     prefix: 'e5' as const,
    //     dims: 768
    // }
};

export const localEmbeddingConstants = {
    modelPrefix: 'local/' as const,
    defaultModel: 'local/multilingual-e5-small',
    models: LOCAL_EMBEDDING_MODELS
} as const;

export type LocalEmbeddingModelConfig = {
    hf: string;
    prefix: 'e5' | null;
    dims: number;
};

export type LocalEmbeddingModelName = keyof typeof localEmbeddingConstants.models;

export const LOCAL_EMBEDDING_MODEL_NAMES = Object.keys(localEmbeddingConstants.models) as LocalEmbeddingModelName[];

export function isLocalEmbeddingModelName(name: string): name is LocalEmbeddingModelName {
    return name in localEmbeddingConstants.models;
}

export function getLocalEmbeddingModelConfig(name: string): LocalEmbeddingModelConfig | null {
    if (!isLocalEmbeddingModelName(name)) {
        return null;
    }

    return localEmbeddingConstants.models[name];
}

export function withLocalEmbeddingPrefix(text: string, kind: 'query' | 'passage', prefix: 'e5' | null): string {
    if (prefix !== 'e5') {
        return text;
    }

    return kind === 'query' ? `query: ${text}` : `passage: ${text}`;
}

export function assertLocalEmbeddingDims(embedding: number[], expectedDims: number): number[] {
    if (embedding.length !== expectedDims) {
        throw new Error(`expected embedding dims ${expectedDims}, got ${embedding.length}`);
    }

    return embedding;
}
