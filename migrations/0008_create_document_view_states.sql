-- Create document_view_states table for persisting zoom and scroll positions
CREATE TABLE IF NOT EXISTS "document_view_states" (
    "id" SERIAL PRIMARY KEY,
    "document_id" TEXT NOT NULL UNIQUE,
    "zoom" TEXT NOT NULL,
    "scroll_top" TEXT NOT NULL,
    "scroll_left" TEXT NOT NULL,
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on document_id for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_document_view_states_document_id"
    ON "document_view_states" ("document_id");

-- Create index on updated_at for cleanup queries
CREATE INDEX IF NOT EXISTS "IDX_document_view_states_updated_at"
    ON "document_view_states" ("updated_at");
