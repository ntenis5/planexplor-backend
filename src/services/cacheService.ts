// src/services/cacheService.ts
import { supabase } from './supabaseClient.js';

export class CacheService {
  private static instance: CacheService;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // GENERAL METHOD FOR CACHE MANAGEMENT
  async manageCache(operation: 'get' | 'set', key: string, data?: any, options?: {
    ttl?: number; // TTL in minutes
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

        // Assuming the RPC returns an object with status and data fields
        // The data field contains the JSON data if status is 'hit'
        return result?.status === 'hit' ? result.data : null;
      } 
      
      else if (operation === 'set' && data) {
        // Ensure TTL is correctly interpreted as minutes by the RPC
        const { error } = await supabase
          .rpc('cache_manager', {
            operation: 'set',
            key_text: key,
            data_json: data,
            cache_type: options?.cacheType || 'api',
            ttl_minutes: options?.ttl || 60 // Assumes options.ttl is already in minutes, or defaults to 60 minutes
          });

        if (error) {
          console.error('Cache set error:', error);
          return false;
        }

        return true;
      }
      
      // Return null or false for unsupported/incomplete operation calls
      return null;

    } catch (error) {
      console.error('Cache service error:', error);
      return null;
    }
  }

  // SPECIFIC METHODS FOR AFFILIATE SERVICE
  async getFromCache(key: string): Promise<any> {
    return this.manageCache('get', key);
  }

  async setToCache(key: string, value: any, ttl?: number): Promise<boolean> {
    // Convert seconds (if provided) to minutes for manageCache/RPC
    const ttlMinutes = ttl ? Math.ceil(ttl / 60) : 60; // Convert seconds to minutes, default 60 min (3600 sec)

    return this.manageCache('set', key, value, {
      ttl: ttlMinutes,
      cacheType: 'affiliate'
    });
  }

  // SPECIFIC METHODS FOR GEOLOCATION
  async getGeolocationCache(query: string): Promise<any> {
    return this.manageCache('get', `geo_${query.toLowerCase().trim()}`);
  }

  async setGeolocationCache(query: string, data: any, ttl: number = 360): Promise<boolean> {
    // TTL parameter here is already in MINUTES (360 minutes = 6 hours) based on previous implementation
    return this.manageCache('set', `geo_${query.toLowerCase().trim()}`, data, {
      ttl: ttl,
      cacheType: 'geo'
    });
  }

  // SPECIFIC METHODS FOR AFFILIATE CACHE
  async getAffiliateCache(category: string, limit: number): Promise<any> {
    return this.manageCache('get', `affiliate_${category}_${limit}`);
  }

  async setAffiliateCache(category: string, limit: number, data: any): Promise<boolean> {
    return this.manageCache('set', `affiliate_${category}_${limit}`, data, {
      ttl: 30, // 30 minutes
      cacheType: 'affiliate'
    });
  }

  // METHOD FOR STATISTICS
  async getCacheStats(): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_cache_stats');

    if (error) {
      console.error('Cache stats error:', error);
      return null;
    }

    // Returns statistics data
    return data;
  }

  // METHOD FOR CLEANUP
  async cleanupCache(): Promise<any> {
    const { data, error } = await supabase
      .rpc('smart_cache_cleanup');

    if (error) {
      console.error('Cache cleanup error:', error);
      return null;
    }

    // Returns cleanup status/results
    return data;
  }
}

export const cacheService = CacheService.getInstance();
