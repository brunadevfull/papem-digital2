/**
 * Constantes do Sistema de Display da Marinha
 * Centraliza valores mágicos e configurações
 */

// ========================================
// INTERVALOS DE TEMPO (em milissegundos)
// ========================================
export const INTERVALS = {
  // Alternância de documentos
  DOCUMENT_ALTERNATE_DEFAULT: 30_000,      // 30 segundos
  ESCALA_ALTERNATE_DEFAULT: 30_000,        // 30 segundos
  CARDAPIO_ALTERNATE_DEFAULT: 30_000,      // 30 segundos

  // Reconexão SSE
  SSE_RECONNECT_DELAY: 5_000,              // 5 segundos
  SSE_HEARTBEAT: 30_000,                   // 30 segundos

  // Cache
  PLASA_CACHE_TTL: 300_000,                // 5 minutos
  WEATHER_CACHE_DEFAULT: 1_800_000,        // 30 minutos
  DOCUMENT_CACHE_DEFAULT: 3_600_000,       // 60 minutos

  // Timeouts
  REQUEST_TIMEOUT_DEFAULT: 30_000,         // 30 segundos
  DATABASE_CONNECTION_TIMEOUT: 2_000,      // 2 segundos

  // Auto-restart
  AUTO_RESTART_DELAY_DEFAULT: 3_000,       // 3 segundos
} as const;

// ========================================
// LIMITES E TAMANHOS
// ========================================
export const LIMITS = {
  // Upload
  MAX_FILE_SIZE: 100 * 1024 * 1024,        // 100MB

  // Cache
  CLASSIFICATION_CACHE_MAX_SIZE: 1000,     // Máximo de entradas no cache de classificação
  PDF_CACHE_MAX_SIZE: 100,                 // Máximo de PDFs em cache
  IMAGE_CACHE_MAX_SIZE: 50,                // Máximo de imagens em cache

  // Database
  DB_POOL_MAX_CONNECTIONS: 20,             // Máximo de conexões ao banco
  DB_IDLE_TIMEOUT: 30_000,                 // Timeout de conexão idle

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: 100,            // Máximo de requisições
  RATE_LIMIT_WINDOW: 60_000,               // Janela de 1 minuto

  // Pagination
  DEFAULT_PAGE_SIZE: 20,                   // Itens por página
  MAX_PAGE_SIZE: 100,                      // Máximo de itens por página
} as const;

// ========================================
// PATHS E DIRETÓRIOS
// ========================================
export const PATHS = {
  UPLOADS_DIR: './uploads',
  PLASA_DIR: './uploads/plasa',
  ESCALA_DIR: './uploads/escala',
  CARDAPIO_DIR: './uploads/cardapio',
  BONO_DIR: './uploads/bono',
  LOGS_DIR: './logs',
  CACHE_DIR: './cache',
} as const;

// ========================================
// VELOCIDADES DE SCROLL
// ========================================
export const SCROLL_SPEEDS = {
  slow: 30,      // pixels por frame
  normal: 50,    // pixels por frame
  fast: 80,      // pixels por frame
} as const;

// ========================================
// TIPOS DE DOCUMENTOS
// ========================================
export const DOCUMENT_TYPES = {
  PLASA: 'plasa',
  ESCALA: 'escala',
  CARDAPIO: 'cardapio',
  BONO: 'bono',
} as const;

// ========================================
// CATEGORIAS MILITARES
// ========================================
export const CATEGORIES = {
  OFICIAL: 'oficial',
  PRACA: 'praca',
} as const;

// ========================================
// UNIDADES
// ========================================
export const UNITS = {
  EAGM: 'EAGM',
  DN1: '1DN',
} as const;

// ========================================
// PRIORIDADES DE AVISOS
// ========================================
export const PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// ========================================
// NÍVEIS DE LOG
// ========================================
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

// ========================================
// ESTADOS DE CONEXÃO SSE
// ========================================
export const SSE_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

// ========================================
// COORDENADAS - RIO DE JANEIRO
// ========================================
export const COORDINATES = {
  RIO_LATITUDE: -22.9068,
  RIO_LONGITUDE: -43.1729,
} as const;

// ========================================
// TIMEZONE
// ========================================
export const TIMEZONE = 'America/Sao_Paulo';

// ========================================
// PATENTES MILITARES
// ========================================
export const MILITARY_RANKS = {
  OFFICERS: ['CA', 'CMG', 'CF', 'CC', 'CT', '1T', '2T'] as const,
  MASTERS: ['1SG', '2SG', '3SG', 'CB', 'SO', 'MN', 'SD'] as const,
} as const;

// ========================================
// VERSÃO DO CONTEXTO (localStorage)
// ========================================
export const CONTEXT_VERSION = 'v3.3';
