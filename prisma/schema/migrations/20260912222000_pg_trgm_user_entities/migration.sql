CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "person_name_trgm_idx" ON "person" USING gin ("name" gin_trgm_ops);

CREATE INDEX "place_name_trgm_idx" ON "place" USING gin ("name" gin_trgm_ops);

CREATE INDEX "place_full_name_trgm_idx" ON "place" USING gin ("full_name" gin_trgm_ops);
