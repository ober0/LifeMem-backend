DELETE FROM "entry_vector";

ALTER TABLE "entry_vector" ALTER COLUMN "embedding" TYPE vector(384);
