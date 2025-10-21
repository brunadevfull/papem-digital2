-- Create dedicated table for duty officer/master assignments
CREATE TABLE IF NOT EXISTS "duty_assignments" (
    "id" SERIAL PRIMARY KEY,
    "officer_name" TEXT NOT NULL,
    "officer_rank" TEXT,
    "master_name" TEXT NOT NULL,
    "master_rank" TEXT,
    "valid_from" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure automatic timestamp updates on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_duty_assignments_updated_at ON "duty_assignments";
CREATE TRIGGER update_duty_assignments_updated_at
    BEFORE UPDATE ON "duty_assignments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Remove legacy duty_role flag usage from military_personnel
ALTER TABLE "military_personnel"
    DROP COLUMN IF EXISTS "duty_role";

-- Helpful index for retrieving the latest assignment quickly
CREATE INDEX IF NOT EXISTS duty_assignments_valid_from_idx
    ON "duty_assignments" ("valid_from" DESC, "updated_at" DESC);
