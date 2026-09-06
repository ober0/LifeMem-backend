CREATE INDEX "entry_vector_embedding_hnsw_384_idx"
    ON "entry_vector"
    USING hnsw ("embedding" vector_cosine_ops)
    WHERE "embedding" IS NOT NULL AND "dimensions" = 384;
