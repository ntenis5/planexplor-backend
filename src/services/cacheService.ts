import { supabase } from './supabaseClient.js';

export class CacheService {
  private static instance: CacheService;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

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
      
      return null;

    } catch (error) {
      console.error('Cache service error:', error);
      return null;
    }
  }

  async getFromCache(key: string): Promise<any> {
    return this.manageCache('get', key);
  }

  async setToCache(key: string, value: any, ttl?: number): Promise<boolean> {
    const ttlMinutes = ttl ? Math.ceil(ttl / 60) : 60;
    return this.manageCache('set', key, value, {
      ttl: ttlMinutes,
      cacheType: 'affiliate'
    });
  }

  async getGeolocationCache(query: string): Promise<any> {
    return this.manageCache('get', `geo_${query.toLowerCase().trim()}`);
  }

  async setGeolocationCache(query: string, data: any, ttl: number = 360): Promise<boolean> {
    return this.manageCache('set', `geo_${query.toLowerCase().trim()}`, data, {
      ttl: ttl,
      cacheType: 'geo'
    });
  }

  async getAffiliateCache(category: string, limit: number): Promise<any> {
    return this.manageCache('get', `affiliate_${category}_${limit}`);
  }

  async setAffiliateCache(category: string, limit: number, data: any): Promise<boolean> {
    return this.manageCache('set', `affiliate_${category}_${limit}`, data, {
      ttl: 30,
      cacheType: 'affiliate'
    });
  }

  async getCacheStats(): Promise<any> {
    // Shënim: Ju kërkohet të thërrisni get_cache_stats (në logje shfaqet get_cache_stats).
    // Kjo thirrje duket se funksionon pa problem.
    const { data, error } = await supabase
      .rpc('get_cache_stats');

    if (error) {
      console.error('Cache stats error:', error);
      return null;
    }

    return data;
  }

  async cleanupCache(): Promise<any> {
    // RREGULLIMI KRYESOR: Shtojmë një objekt bosh {} si argument.
    // Kjo zgjidh gabimin 'PGRST202' që ndodh kur funksioni i databazës 
    // pritet të pranojë një argument JSON/JSONB (edhe pse mund të jetë bosh).
    const { data, error } = await supabase
      .rpc('smart_cache_cleanup', {}); // RREGULLUAR KËTU

    if (error) {
      console.error('Cache cleanup error:', error);
      return null;
    }

    return data;
  }
}

export const cacheService = CacheService.getInstance();
