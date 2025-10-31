/**
 * Implementação de LRU (Least Recently Used) Cache
 * Para prevenir memory leaks em caches sem limite
 */

export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map<K, V>();
  }

  /**
   * Obtém um valor do cache
   * Move o item para o final (mais recente)
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move para o final (mais recente)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * Adiciona ou atualiza um valor no cache
   * Remove o item mais antigo se exceder o limite
   */
  set(key: K, value: V): void {
    // Se já existe, remove para re-inserir no final
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Se atingiu o limite, remove o mais antigo (primeiro item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove um item do cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retorna o tamanho atual do cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Retorna todas as chaves do cache
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Retorna todos os valores do cache
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; maxSize: number; utilizationPercent: number } {
    const size = this.cache.size;
    const utilizationPercent = (size / this.maxSize) * 100;

    return {
      size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    };
  }
}

/**
 * Cache com TTL (Time To Live)
 * Expira automaticamente após um tempo
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private maxSize: number;
  private ttl: number;
  private cache: Map<K, CacheEntry<V>>;

  constructor(maxSize: number = 1000, ttl: number = 3600000) { // 1 hora padrão
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map<K, CacheEntry<V>>();
  }

  /**
   * Obtém um valor do cache
   * Retorna undefined se expirado
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Verifica se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Adiciona ou atualiza um valor no cache com TTL
   */
  set(key: K, value: V, customTTL?: number): void {
    // Se atingiu o limite, remove o mais antigo
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + (customTTL || this.ttl);

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Verifica se uma chave existe e não expirou
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove um item do cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove entradas expiradas
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Retorna o tamanho atual do cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    ttl: number;
  } {
    const size = this.cache.size;
    const utilizationPercent = (size / this.maxSize) * 100;

    return {
      size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      ttl: this.ttl,
    };
  }
}
