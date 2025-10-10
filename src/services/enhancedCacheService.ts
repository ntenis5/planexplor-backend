// src/services/enhancedCacheService.ts
import { supabase } from './supabaseClient.js';
import { scalingService, CacheStrategy } from './scalingService.js';

// Define the expected structure for the cache_manager RPC response
interface CacheManagerResponse {
  status: 'hit' | 'miss' | 'invalid_key';
  data: any; // The cached data
}

export class EnhancedCacheService {
  
  async smartGet(cacheKey: string, endpoint: string, userRegion: string = 'eu'): Promise<any> {
    // Get the optimal strategy
    const strategy: CacheStrategy = await scalingService.getCacheStrategy(endpoint, userRegion);
    
    // Validate access
    const isValid = await scalingService.validateCacheAccess(
      cacheKey, 
      ['authenticated'] // Permissions based on authentication status
    );
    
    if (!isValid) {
      return { status: 'invalid_access', data: null, strategy };
    }

    // Use cache manager with the strategy
    const { data, error } = await supabase
      .rpc('cache_manager', {
        operation: 'get',
        key_text: cacheKey
      })
      .returns<CacheManagerResponse[]>(); // RPC returns an array

    // Check for general errors or if data array is empty
    if (error || !data || data.length === 0) {
      if (error) console.error("Cache Manager RPC Error:", error);
      return { status: 'miss', strategy };
    }
    
    // Extract the single result object from the array
    const cacheResult = data[0];

    if (cacheResult.status !== 'hit') {
      return { status: 'miss', strategy };
    }

    return { 
      status: 'hit', 
      data: cacheResult.data,
      strategy 
    };
  }

  async smartSet(cacheKey: string, data: any, endpoint: string, userRegion: string = 'eu'): Promise<{ success: boolean, strategy: CacheStrategy }> {
    const strategy: CacheStrategy = await scalingService.getCacheStrategy(endpoint, userRegion);
    
    const { error } = await supabase
      .rpc('cache_manager', {
        operation: 'set',
        key_text: cacheKey,
        data_json: data,
        cache_type: this.getCacheType(endpoint),
        ttl_minutes: strategy.ttl_minutes
      });

    return { success: !error, strategy };
  }

  private getCacheType(endpoint: string): string {
    if (endpoint.includes('geolocation')) return 'geo';
    if (endpoint.includes('affiliate')) return 'affiliate';
    if (endpoint.includes('maps')) return 'map';
    return 'api';
  }

  async getSystemHealth(): Promise<any> {
    const [scalingNeeds, performance] = await Promise.all([
      scalingService.checkScalingNeeds(),
      this.getPerformanceStats()
    ]);

    return {
      scaling: scalingNeeds,
      performance,
      timestamp: new Date().toISOString()
    };
  }

  private async getPerformanceStats(): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_cache_stats');

    // Supabase RPC returns an array, return the data if present, otherwise an empty object
    return error || !data || data.length === 0 ? {} : data[0]; 
  }
}

export const enhancedCacheService = new EnhancedCacheService();
