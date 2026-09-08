ALTER TYPE "entry_processing_status" ADD VALUE IF NOT EXISTS 'Cancelled';

DROP INDEX IF EXISTS "entry_processing_job_entry_id_type_key";

CREATE UNIQUE INDEX "entry_processing_job_entry_id_type_active_key"
    ON "entry_processing_job" ("entry_id", "type")
    WHERE "status" IN ('Pending', 'Running');
