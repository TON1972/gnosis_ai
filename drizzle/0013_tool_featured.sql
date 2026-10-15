ALTER TABLE "tools" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false;
UPDATE "tools" SET "isFeatured" = false WHERE "isFeatured" IS NULL;
