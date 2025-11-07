import { resolveBackendUrl } from "@/utils/backend";

type ScrollSpeed = "slow" | "normal" | "fast";

export interface DisplaySettingsDTO {
  scrollSpeed: ScrollSpeed;
  escalaAlternateInterval: number;
  cardapioAlternateInterval: number;
  autoRestartDelay: number;
  updatedAt: string;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettingsDTO = {
  scrollSpeed: "normal",
  escalaAlternateInterval: 30000,
  cardapioAlternateInterval: 30000,
  autoRestartDelay: 3,
  updatedAt: new Date(0).toISOString(),
};

const parseNumber = (value: unknown, fallback: number, { min, max }: { min: number; max: number }): number => {
  const numeric = typeof value === "string" ? Number.parseInt(value, 10) : typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const bounded = Math.trunc(numeric);
  return Math.max(min, Math.min(max, bounded));
};

const SCROLL_SPEED_VALUES: ScrollSpeed[] = ["slow", "normal", "fast"];

const parseScrollSpeed = (value: unknown, fallback: ScrollSpeed): ScrollSpeed => {
  if (typeof value === "string" && SCROLL_SPEED_VALUES.includes(value as ScrollSpeed)) {
    return value as ScrollSpeed;
  }

  return fallback;
};

const sanitizeDisplaySettings = (input: unknown): DisplaySettingsDTO => {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_DISPLAY_SETTINGS };
  }

  const base = input as Record<string, unknown>;
  const updatedAtRaw = base.updatedAt ?? base.updated_at;
  const updatedAt = updatedAtRaw ? new Date(updatedAtRaw as string | number | Date) : new Date();

  return {
    scrollSpeed: parseScrollSpeed(base.scrollSpeed ?? base.scroll_speed, DEFAULT_DISPLAY_SETTINGS.scrollSpeed),
    escalaAlternateInterval: parseNumber(
      base.escalaAlternateInterval ?? base.escala_alternate_interval,
      DEFAULT_DISPLAY_SETTINGS.escalaAlternateInterval,
      { min: 1000, max: 60 * 60 * 1000 }
    ),
    cardapioAlternateInterval: parseNumber(
      base.cardapioAlternateInterval ?? base.cardapio_alternate_interval,
      DEFAULT_DISPLAY_SETTINGS.cardapioAlternateInterval,
      { min: 1000, max: 60 * 60 * 1000 }
    ),
    autoRestartDelay: parseNumber(
      base.autoRestartDelay ?? base.auto_restart_delay,
      DEFAULT_DISPLAY_SETTINGS.autoRestartDelay,
      { min: 1, max: 600 }
    ),
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date().toISOString() : updatedAt.toISOString(),
  };
};

const buildRequestInit = (init?: RequestInit): RequestInit => ({
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  },
  ...init,
});

export const fetchDisplaySettings = async (): Promise<DisplaySettingsDTO> => {
  const response = await fetch(resolveBackendUrl("/api/display-settings"), buildRequestInit());
  if (!response.ok) {
    throw new Error(`Failed to fetch display settings: ${response.status}`);
  }

  const data = await response.json();
  return sanitizeDisplaySettings(data);
};

export const updateDisplaySettings = async (
  patch: Partial<Pick<DisplaySettingsDTO, "scrollSpeed" | "escalaAlternateInterval" | "cardapioAlternateInterval" | "autoRestartDelay">>
): Promise<DisplaySettingsDTO> => {
  const response = await fetch(
    resolveBackendUrl("/api/display-settings"),
    buildRequestInit({
      method: "PUT",
      body: JSON.stringify(patch),
    })
  );

  if (!response.ok) {
    throw new Error(`Failed to update display settings: ${response.status}`);
  }

  const data = await response.json();
  return sanitizeDisplaySettings(data);
};
