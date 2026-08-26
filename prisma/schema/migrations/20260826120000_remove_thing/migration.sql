-- DropForeignKey
ALTER TABLE "entry_thing" DROP CONSTRAINT "entry_thing_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_thing" DROP CONSTRAINT "entry_thing_thing_id_fkey";

-- DropForeignKey
ALTER TABLE "thing" DROP CONSTRAINT "thing_user_id_fkey";

-- DropTable
DROP TABLE "entry_thing";

-- DropTable
DROP TABLE "thing";
