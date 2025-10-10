// src/services/cacheService.ts - VERSION I KORRIGJUAR
import { supabase } from './supabaseClient.js';

export class CacheService {
  private static instance: CacheService;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // METODA E PËRGJITHSHME PËR CACHE
  async manageCache(operation: 'get' | 'set', key: string, data?: any, options?: {
    ttl?: number;
    cacheType?: string;
  }): Promise<any> {
    try {
      if (operation === 'get') {
        const { data: result, error } = await supabase
          .rpc('cache_manager', {
            operation: 'get',
            key_text: key
          });

        if (error) {
          console.error('Cache get error:', error);
          return null;
        }

        return result?.status === 'hit' ? result.data : null;
      } 
      
      else if (operation === 'set' && data) {
        const { error } = await supabase
          .rpc('cache_manager', {
            operation: 'set',
            key_text: key,
            data_json: data,
            cache_type: options?.cacheType || 'api',
            ttl_minutes: options?.ttl || 60
          });

        if (error) {
          console.error('Cache set error:', error);
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error('Cache service error:', error);
      return null;
    }
  }

  // METODAT SPECIFIKE PËR AFFILIATE SERVICE
  async getFromCache(key: string): Promise<any> {
    return this.manageCache('get', key);
  }

  async setToCache(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.manageCache('set', key, value, {
      ttl: ttl ? ttl / 60 : 60, // Konverto sekondat në minuta
      cacheType: 'affiliate'
    });
  }

  // METODA SPECIFIKE PËR GEOLOCATION
  async getGeolocationCache(query: string): Promise<any> {
    return this.manageCache('get', `geo_${query.toLowerCase().trim()}`);
  }

  async setGeolocationCache(query: string, data: any, ttl: number = 360): Promise<boolean> {
    return this.manageCache('set', `geo_${query.toLowerCase().trim()}`, data, {
      ttl: ttl,
      cacheType: 'geo'
    });
  }

  // METODA SPECIFIKE PËR AFFILIATE CACHE
  async getAffiliateCache(category: string, limit: number): Promise<any> {
    return this.manageCache('get', `affiliate_${category}_${limit}`);
  }

  async setAffiliateCache(category: string, limit: number, data: any): Promise<boolean> {
    return this.manageCache('set', `affiliate_${category}_${limit}`, data, {
      ttl: 30,
      cacheType: 'affiliate'
    });
  }

  // METODA PËR STATISTIKA
  async getCacheStats(): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_cache_stats');

    if (error) {
      console.error('Cache stats error:', error);
      return null;
    }

    return data;
  }

  // METODA PËR PASTRIM
  async cleanupCache(): Promise<any> {
    const { data, error } = await supabase
      .rpc('smart_cache_cleanup');

    if (error) {
      console.error('Cache cleanup error:', error);
      return null;
    }

    return data;
  }
}

export const cacheService = CacheService.getInstance();
