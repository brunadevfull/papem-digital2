CREATE TABLE IF NOT EXISTS display_settings (
    id SERIAL PRIMARY KEY,
    scroll_speed TEXT NOT NULL DEFAULT 'normal',
    escala_alternate_interval INTEGER NOT NULL DEFAULT 30000,
    cardapio_alternate_interval INTEGER NOT NULL DEFAULT 30000,
    auto_restart_delay INTEGER NOT NULL DEFAULT 3,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO display_settings (id, scroll_speed, escala_alternate_interval, cardapio_alternate_interval, auto_restart_delay)
VALUES (1, 'normal', 30000, 30000, 3)
ON CONFLICT (id) DO NOTHING;
