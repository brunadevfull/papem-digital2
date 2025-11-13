-- Create table to store persisted display configuration values
CREATE TABLE IF NOT EXISTS "display_settings" (
    "id" SERIAL PRIMARY KEY,
    "scroll_speed" TEXT NOT NULL DEFAULT 'normal',
    "escala_alternate_interval" INTEGER NOT NULL DEFAULT 30000,
    "cardapio_alternate_interval" INTEGER NOT NULL DEFAULT 30000,
    "auto_restart_delay" INTEGER NOT NULL DEFAULT 3,
    "global_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "plasa_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "escala_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "cardapio_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT display_settings_scroll_speed_check
      CHECK ("scroll_speed" IN ('slow', 'normal', 'fast'))
);
