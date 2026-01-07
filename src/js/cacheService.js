/**
 * cacheService.js
 * Zentraler Cache-Service für YouTube API-Aufrufe (Browser Only)
 * Speichert Daten im LocalStorage, um API-Quota zu sparen.
 */

// Cache-Dauer: 24 Stunden (in Millisekunden)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

class CacheService {
  constructor() {
    this.memoryCache = {};
  }

  /**
   * Versucht Daten aus dem Cache zu holen.
   * Wenn nicht vorhanden oder abgelaufen, wird die fetcher-Funktion ausgeführt.
   * @param {string} key - Eindeutiger Schlüssel für den Cache
   * @param {Function} fetcher - Async Funktion, die die Daten holt, falls Cache leer
   */
  async getOrFetch(key, fetcher) {
    const cached = this.getFromLocalStorage(key);

    if (cached && !this.isExpired(cached.timestamp)) {
      console.log(`[Cache] Hit: ${key} (aus LocalStorage)`);
      return cached.data;
    }

    console.log(`[Cache] Miss: ${key} - Lade frisch von API...`);
    try {
      const freshData = await fetcher();
      
      // Nur speichern, wenn wir valide Daten bekommen haben
      if (freshData) {
        this.saveToLocalStorage(key, freshData);
      }
      return freshData;
    } catch (error) {
      console.error(`[Cache] Fetch Error bei ${key}:`, error);
      
      // Fallback: Wenn API fehlschlägt, geben wir alte Cache-Daten zurück (auch wenn abgelaufen)
      // Das ist besser als eine leere Seite.
      if (cached) {
        console.warn(`[Cache] Verwende veraltete Daten als Notfall-Fallback für: ${key}`);
        return cached.data;
      }
      throw error;
    }
  }

  isExpired(timestamp) {
    return Date.now() - timestamp > CACHE_DURATION;
  }

  getFromLocalStorage(key) {
    try {
      const raw = localStorage.getItem(`yt_cache_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('LocalStorage Zugriff fehlgeschlagen', e);
      return null;
    }
  }

  saveToLocalStorage(key, data) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`yt_cache_${key}`, JSON.stringify(cacheItem));
      // Update Memory Cache
      this.memoryCache[key] = cacheItem;
    } catch (e) {
      console.warn('LocalStorage voll oder gesperrt', e);
    }
  }
  
  clearCache() {
      localStorage.clear();
      console.log('Cache geleert.');
  }
}

// Singleton-Instanz exportieren
const cacheService = new CacheService();
export default cacheService;