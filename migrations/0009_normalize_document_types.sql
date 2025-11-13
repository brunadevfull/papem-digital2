-- Normalize document types and backfill units derived from legacy suffixes
WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN type ILIKE 'plasa%' THEN 'plasa'
      WHEN type ILIKE 'escala%' THEN 'escala'
      WHEN type ~* '^card[aá]pio' THEN 'cardapio'
      ELSE type
    END AS normalized_type,
    CASE
      WHEN unit IS NOT NULL THEN unit
      WHEN type ~* '^card[aá]pio' THEN (
        CASE
          WHEN upper(regexp_replace(type, '^card[aá]pio[^A-Z0-9]*', '', 'i')) ~ '1DN|DN1' THEN '1DN'
          WHEN upper(regexp_replace(type, '^card[aá]pio[^A-Z0-9]*', '', 'i')) LIKE '%EAGM%' THEN 'EAGM'
          ELSE NULL
        END
      )
      ELSE NULL
    END AS derived_unit
  FROM documents
)
UPDATE documents d
SET
  type = normalized.normalized_type,
  unit = COALESCE(normalized.derived_unit, d.unit)
FROM normalized
WHERE d.id = normalized.id
  AND (
    d.type IS DISTINCT FROM normalized.normalized_type
    OR (normalized.derived_unit IS NOT NULL AND normalized.derived_unit IS DISTINCT FROM d.unit)
  );
