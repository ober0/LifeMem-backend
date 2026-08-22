/*
  Warnings:

  - You are about to drop the column `isReady` on the `entry` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `file` table. All the data in the column will be lost.
  - Added the required column `dimensions` to the `entry_vector` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `entry_vector` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "entry" DROP COLUMN "isReady",
ADD COLUMN     "is_ready" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "location_label" TEXT,
ADD COLUMN     "longitude" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "entry_vector" ADD COLUMN     "dimensions" INTEGER NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ALTER COLUMN "embedding" DROP NOT NULL;

-- AlterTable
ALTER TABLE "file" DROP COLUMN "mimeType",
ADD COLUMN     "mime_type" TEXT;

-- CreateTable
CREATE TABLE "person" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thing" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_person" (
    "entry_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_person_pkey" PRIMARY KEY ("entry_id","person_id")
);

-- CreateTable
CREATE TABLE "entry_place" (
    "entry_id" UUID NOT NULL,
    "place_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_place_pkey" PRIMARY KEY ("entry_id","place_id")
);

-- CreateTable
CREATE TABLE "entry_thing" (
    "entry_id" UUID NOT NULL,
    "thing_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_thing_pkey" PRIMARY KEY ("entry_id","thing_id")
);

-- CreateIndex
CREATE INDEX "person_user_id_idx" ON "person"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_user_id_name_key" ON "person"("user_id", "name");

-- CreateIndex
CREATE INDEX "place_user_id_idx" ON "place"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_user_id_name_key" ON "place"("user_id", "name");

-- CreateIndex
CREATE INDEX "thing_user_id_idx" ON "thing"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "thing_user_id_name_key" ON "thing"("user_id", "name");

-- CreateIndex
CREATE INDEX "entry_user_id_is_ready_created_at_idx" ON "entry"("user_id", "is_ready", "created_at");

-- CreateIndex
CREATE INDEX "entry_vector_dimensions_idx" ON "entry_vector"("dimensions");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place" ADD CONSTRAINT "place_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thing" ADD CONSTRAINT "thing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_person" ADD CONSTRAINT "entry_person_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_person" ADD CONSTRAINT "entry_person_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_place" ADD CONSTRAINT "entry_place_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_place" ADD CONSTRAINT "entry_place_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_thing" ADD CONSTRAINT "entry_thing_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_thing" ADD CONSTRAINT "entry_thing_thing_id_fkey" FOREIGN KEY ("thing_id") REFERENCES "thing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
