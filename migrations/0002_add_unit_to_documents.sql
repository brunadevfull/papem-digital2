ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS unit text CHECK (unit IN ('EAGM', '1DN'));

-- Backfill unit information from existing tags when available
UPDATE documents
SET unit = 'EAGM'
WHERE unit IS NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(tags) AS tag
    WHERE upper(tag) = 'EAGM'
  );

UPDATE documents
SET unit = '1DN'
WHERE unit IS NULL
  AND EXISTS (
    SELECT 1
    FROM unnest(tags) AS tag
    WHERE replace(upper(tag), 'º', '') = '1DN'
       OR upper(tag) = '1DN'
  );
