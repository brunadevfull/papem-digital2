-- Remove legacy duty_officers table and any dependencies
DROP TABLE IF EXISTS "duty_officers" CASCADE;

-- Drop the serial sequence if it remains after the cascade
DROP SEQUENCE IF EXISTS "duty_officers_id_seq";
