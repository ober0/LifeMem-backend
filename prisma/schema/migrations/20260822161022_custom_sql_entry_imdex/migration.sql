CREATE INDEX "entry_vector_kind_dimensions_idx"
    ON "entry_vector" ("kind", "dimensions")
    WHERE "embedding" IS NOT NULL;

CREATE INDEX "entry_vector_embedding_hnsw_1536_idx"
    ON "entry_vector"
    USING hnsw ("embedding" vector_cosine_ops)
    WHERE "embedding" IS NOT NULL AND "dimensions" = 1536;

CREATE INDEX "entry_user_coords_idx"
    ON "entry" ("user_id", "latitude", "longitude")
    WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;