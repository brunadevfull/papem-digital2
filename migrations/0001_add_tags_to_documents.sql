ALTER TABLE "documents"
ADD COLUMN "tags" text[] NOT NULL DEFAULT ARRAY[]::text[];
