CREATE TABLE "asc_entry" (
    "asc_id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "asc_entry_pkey" PRIMARY KEY ("asc_id","entry_id")
);

CREATE INDEX "asc_entry_asc_id_idx" ON "asc_entry"("asc_id");

ALTER TABLE "asc_entry" ADD CONSTRAINT "asc_entry_asc_id_fkey" FOREIGN KEY ("asc_id") REFERENCES "asc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asc_entry" ADD CONSTRAINT "asc_entry_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
