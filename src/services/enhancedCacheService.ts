// src/services/enhancedCacheService.ts
import { supabase } from './supabaseClient.js';
import { scalingService } from './scalingService.js';

export class EnhancedCacheService {
  
  /**
   * Retrieves data from the cache using an intelligent strategy.
   * @param cacheKey The key to look up in the cache.
   * @param endpoint The API endpoint path.
   * @param userRegion The region of the user accessing the endpoint.
   * @returns An object containing the cache status, data (on hit), and the applied strategy.
   */
  async smartGet(cacheKey: string, endpoint: string, userRegion: string = 'eu') {
    try {
      // Fetch the optimal strategy
      const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
      
      // Validate access
      // NOTE: Assuming validateCacheAccess requires the key and a list of required roles/permissions.
      const isValid = await scalingService.validateCacheAccess(cacheKey, ['authenticated']);
      
      if (!isValid) {
        return { status: 'invalid_access', data: null };
      }

      // Use the cache manager with the determined strategy
      const { data, error } = await supabase
        .rpc('cache_manager', {
          operation: 'get',
          key_text: cacheKey
        });

      // Check for errors or a cache miss
      if (error || data?.status !== 'hit') {
        return { status: 'miss', data: null, strategy }; // Explicitly set data to null on miss/error
      }

      return { 
        status: 'hit', 
        data: data.data,
        strategy 
      };
    } catch (error) {
      console.error('Error in smartGet:', error);
      return { status: 'error', data: null, strategy: null }; // Added strategy: null on outer error
    }
  }

  /**
   * Sets data in the cache using an intelligent strategy.
   * @param cacheKey The key to store the data under.
   * @param data The data to be stored.
   * @param endpoint The API endpoint path.
   * @param userRegion The region of the user accessing the endpoint.
   * @returns An object indicating success and the applied strategy.
   */
  async smartSet(cacheKey: string, data: any, endpoint: string, userRegion: string = 'eu') {
    try {
      const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
      
      // The RPC expects ttl_minutes. Strategy is assumed to provide this.
      const { error } = await supabase
        .rpc('cache_manager', {
          operation: 'set',
          key_text: cacheKey,
          data_json: data,
          cache_type: this.getCacheType(endpoint),
          ttl_minutes: strategy.ttl_minutes // Use TTL from the optimal strategy
        });

      return { success: !error, strategy };
    } catch (error) {
      console.error('Error in smartSet:', error);
      return { success: false, strategy: null };
    }
  }

  private getCacheType(endpoint: string): string {
    if (endpoint.includes('geolocation')) return 'geo';
    if (endpoint.includes('affiliate')) return 'affiliate';
    if (endpoint.includes('maps')) return 'map';
    return 'api';
  }

  /**
   * Fetches the overall system health, including scaling needs and performance stats.
   * @returns An object containing scaling status, performance data, and a timestamp.
   */
  async getSystemHealth() {
    try {
      const [scalingNeeds, performance] = await Promise.all([
        scalingService.checkScalingNeeds(),
        this.getPerformanceStats()
      ]);

      return {
        scaling: scalingNeeds,
        performance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getSystemHealth:', error);
      return {
        scaling: {},
        performance: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getPerformanceStats() {
    try {
      // Assuming 'get_cache_stats' returns a single object or an array of objects
      const { data, error } = await supabase.rpc('get_cache_stats');
      
      if (error || !data) {
        console.error('Cache stats error:', error);
        return {};
      }

      const statsData = data as any;
      
      // If an array is returned, use the first element (common for single-row reports from RPC)
      if (Array.isArray(statsData) && statsData.length > 0) {
        return statsData[0];
      }
      
      // If a single object is returned, use it directly 
      if (typeof statsData === 'object' && statsData !== null) {
        return statsData;
      }
      
      return {};
      
    } catch (error) {
      console.error('Error in getPerformanceStats:', error);
      return {};
    }
  }
}

export const enhancedCacheService = new EnhancedCacheService();
