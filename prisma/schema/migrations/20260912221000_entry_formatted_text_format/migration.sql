CREATE TYPE "entry_formatted_text_format" AS ENUM ('plain', 'markdown', 'html');

ALTER TABLE "entry" ADD COLUMN "formatted_text_format" "entry_formatted_text_format";
