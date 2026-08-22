-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "entry_vector_kind" AS ENUM ('Text', 'Title', 'Image');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "entry" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_image" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "aiTranscription" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_voice" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "aiTranscription" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_voice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_vector" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "kind" "entry_vector_kind" NOT NULL DEFAULT 'Text',
    "embedding" vector(1536) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_vector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "size" BIGINT,
    "type" "FileType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entry_user_id_idx" ON "entry"("user_id");

-- CreateIndex
CREATE INDEX "entry_user_id_created_at_idx" ON "entry"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "entry_voice_entryId_key" ON "entry_voice"("entryId");

-- CreateIndex
CREATE INDEX "entry_vector_entry_id_idx" ON "entry_vector"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "entry_vector_entry_id_kind_key" ON "entry_vector"("entry_id", "kind");

CREATE INDEX entry_vector_embedding_hnsw_idx
    ON entry_vector
    USING hnsw (embedding vector_cosine_ops);

-- CreateIndex
CREATE INDEX "file_key_idx" ON "file"("key");

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_image" ADD CONSTRAINT "entry_image_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_image" ADD CONSTRAINT "entry_image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_voice" ADD CONSTRAINT "entry_voice_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_voice" ADD CONSTRAINT "entry_voice_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_vector" ADD CONSTRAINT "entry_vector_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
