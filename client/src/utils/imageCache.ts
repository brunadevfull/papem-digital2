/**
 * ImageCache - Sistema de cache de imagens usando IndexedDB
 * Armazena imagens convertidas no navegador para evitar requisições HTTP desnecessárias
 */

const DB_NAME = 'papem-image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

interface CacheEntry {
  key: string;
  data: string; // Base64 data URL
  timestamp: number;
  size: number;
}

class ImageCacheDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Inicializa o banco de dados IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Criar object store se não existir
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('📦 Object store criado');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Gera chave única para cache baseada na URL
   */
  private generateKey(url: string): string {
    // Remove query params e cria hash simples
    const cleanUrl = url.split('?')[0];
    return `img_${btoa(cleanUrl).substring(0, 50)}`;
  }

  /**
   * Salva imagem no cache
   */
  async set(url: string, dataUrl: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) throw new Error('DB não inicializado');

      const key = this.generateKey(url);
      const entry: CacheEntry = {
        key,
        data: dataUrl,
        timestamp: Date.now(),
        size: dataUrl.length
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(entry);

        request.onsuccess = () => {
          console.log(`💾 Cache salvo: ${url.substring(0, 50)}... (${(entry.size / 1024).toFixed(2)} KB)`);
          resolve();
        };

        request.onerror = () => {
          console.error('❌ Erro ao salvar cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao salvar no cache:', error);
    }
  }

  /**
   * Recupera imagem do cache
   */
  async get(url: string): Promise<string | null> {
    try {
      await this.init();
      if (!this.db) return null;

      const key = this.generateKey(url);

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CacheEntry | undefined;

          if (!entry) {
            console.log(`🔍 Cache miss: ${url.substring(0, 50)}...`);
            resolve(null);
            return;
          }

          // Verificar se cache expirou
          const age = Date.now() - entry.timestamp;
          if (age > CACHE_DURATION) {
            console.log(`⏰ Cache expirado: ${url.substring(0, 50)}...`);
            this.delete(url); // Remover entrada expirada
            resolve(null);
            return;
          }

          console.log(`✅ Cache hit: ${url.substring(0, 50)}... (${(entry.size / 1024).toFixed(2)} KB)`);
          resolve(entry.data);
        };

        request.onerror = () => {
          console.error('❌ Erro ao ler cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao ler cache:', error);
      return null;
    }
  }

  /**
   * Remove entrada específica do cache
   */
  async delete(url: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const key = this.generateKey(url);

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          console.log(`🗑️ Cache removido: ${url.substring(0, 50)}...`);
          resolve();
        };

        request.onerror = () => {
          console.error('❌ Erro ao remover cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao remover do cache:', error);
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('🗑️ Cache limpo completamente');
          resolve();
        };

        request.onerror = () => {
          console.error('❌ Erro ao limpar cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao limpar cache:', error);
    }
  }

  /**
   * Remove entradas antigas automaticamente
   */
  async cleanupOldEntries(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const cutoffTime = Date.now() - CACHE_DURATION;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoffTime);
        const request = index.openCursor(range);

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            if (deletedCount > 0) {
              console.log(`🗑️ ${deletedCount} entrada(s) antiga(s) removida(s)`);
            }
            resolve();
          }
        };

        request.onerror = () => {
          console.error('❌ Erro ao limpar entradas antigas:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao limpar entradas antigas:', error);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      await this.init();
      if (!this.db) return { count: 0, totalSize: 0 };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const entries = request.result as CacheEntry[];
          const count = entries.length;
          const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

          console.log(`📊 Cache: ${count} imagem(ns), ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
          resolve({ count, totalSize });
        };

        request.onerror = () => {
          console.error('❌ Erro ao obter estatísticas:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn('⚠️ Falha ao obter estatísticas:', error);
      return { count: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
const imageCache = new ImageCacheDB();

// Limpar entradas antigas ao inicializar
if (typeof window !== 'undefined') {
  imageCache.cleanupOldEntries().catch(console.error);
}

export default imageCache;
