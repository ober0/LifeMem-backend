-- CreateEnum
CREATE TYPE "cinfirm_code_type" AS ENUM ('Email', 'Phone');

-- CreateEnum
CREATE TYPE "auth_type" AS ENUM ('Oauth', 'Phone', 'Email');

-- CreateEnum
CREATE TYPE "oauth_provider" AS ENUM ('Google', 'Apple');

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_password_id_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "confirm_code" (
    "id" UUID NOT NULL,
    "type" "cinfirm_code_type" NOT NULL,
    "code" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "confirm_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_logs" (
    "id" UUID NOT NULL,
    "type" "auth_type" NOT NULL,
    "ip" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_oauth_provider" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "oauth_provider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_email" TEXT,
    "provider_username" TEXT,
    "provider_avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_oauth_provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_oauth_provider_user_id_provider_idx" ON "user_oauth_provider"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_provider_provider_provider_user_id_key" ON "user_oauth_provider"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_provider_user_id_provider_key" ON "user_oauth_provider"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "confirm_code" ADD CONSTRAINT "confirm_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_provider" ADD CONSTRAINT "user_oauth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_password_id_fkey" FOREIGN KEY ("password_id") REFERENCES "password"("id") ON DELETE SET NULL ON UPDATE CASCADE;
