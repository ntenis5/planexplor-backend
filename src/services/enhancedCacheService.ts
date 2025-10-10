// src/services/enhancedCacheService.ts
import { supabase } from './supabaseClient.js';
import { scalingService } from './scalingService.js';

export class EnhancedCacheService {
  
  async smartGet(cacheKey: string, endpoint: string, userRegion: string = 'eu') {
    // Merr strategjinë optimale
    const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
    
    // Valido aksesin
    const isValid = await scalingService.validateCacheAccess(
      cacheKey, 
      ['authenticated'] // Nga authentication
    );
    
    if (!isValid) {
      return { status: 'invalid_access', data: null };
    }

    // Përdor cache manager me strategji
    const { data, error } = await supabase
      .rpc('cache_manager', {
        operation: 'get',
        key_text: cacheKey
      });

    if (error || data?.status !== 'hit') {
      return { status: 'miss', strategy };
    }

    return { 
      status: 'hit', 
      data: data.data,
      strategy 
    };
  }

  async smartSet(cacheKey: string, data: any, endpoint: string, userRegion: string = 'eu') {
    const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
    
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

  async getSystemHealth() {
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

  private async getPerformanceStats() {
    const { data, error } = await supabase
      .rpc('get_cache_stats');

    return error ? {} : data;
  }
}

export const enhancedCacheService = new EnhancedCacheService();
