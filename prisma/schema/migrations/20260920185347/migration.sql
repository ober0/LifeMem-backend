-- CreateEnum
CREATE TYPE "AscStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "asc" (
    "id" UUID NOT NULL,
    "status" "AscStatus" NOT NULL,
    "userId" UUID,
    "asc" TEXT,
    "result" TEXT,
    "sourceCount" INTEGER,
    "time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asc_usage" (
    "id" UUID NOT NULL,
    "modelid" UUID,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "price" DECIMAL(12,6),
    "provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asc_usage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "asc" ADD CONSTRAINT "asc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asc_usage" ADD CONSTRAINT "asc_usage_modelid_fkey" FOREIGN KEY ("modelid") REFERENCES "ai_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;
