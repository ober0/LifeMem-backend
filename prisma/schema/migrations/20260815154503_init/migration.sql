-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" UUID NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "ip" TEXT,
    "body" TEXT,
    "is_success" BOOLEAN NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_category" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "permission_category_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "json" JSONB NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_settings" (
    "id" UUID NOT NULL,
    "json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password" (
    "id" UUID NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "nickname" TEXT NOT NULL,
    "password_id" UUID NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "user_email_or_phone_check"
        CHECK ("email" IS NOT NULL OR "phone_number" IS NOT NULL)
);
-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_key" ON "refresh_token"("token");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");

-- CreateIndex
CREATE INDEX "logs_user_id_idx" ON "logs"("user_id");

-- CreateIndex
CREATE INDEX "logs_created_at_idx" ON "logs"("created_at");

-- CreateIndex
CREATE INDEX "logs_user_id_created_at_idx" ON "logs"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_category_key_key" ON "permission_category"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE INDEX "permission_permission_category_id_idx" ON "permission"("permission_category_id");

-- CreateIndex
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_id_key" ON "user"("password_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "user"("phone_number");

-- CreateIndex
CREATE INDEX "user_role_id_idx" ON "user"("role_id");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_permission_category_id_fkey" FOREIGN KEY ("permission_category_id") REFERENCES "permission_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_password_id_fkey" FOREIGN KEY ("password_id") REFERENCES "password"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
