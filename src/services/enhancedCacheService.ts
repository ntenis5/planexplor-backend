// src/services/enhancedCacheService.ts
import { supabase } from './supabaseClient.js';
import { scalingService } from './scalingService.js';

export class EnhancedCacheService {
  
  async smartGet(cacheKey: string, endpoint: string, userRegion: string = 'eu') {
    try {
      // Merr strategjinë optimale
      const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
      
      // Valido aksesin
      const isValid = await scalingService.validateCacheAccess(cacheKey, ['authenticated']);
      
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
    } catch (error) {
      console.error('Error in smartGet:', error);
      return { status: 'error', data: null };
    }
  }

  async smartSet(cacheKey: string, data: any, endpoint: string, userRegion: string = 'eu') {
    try {
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
      const { data, error } = await supabase.rpc('get_cache_stats');
      
      if (error || !data) {
        console.error('Cache stats error:', error);
        return {};
      }

      // ✅ KORRIGJIM: Përdor 'as any' për të shmangur gabimet TypeScript
      const statsData = data as any;
      
      // Nëse është array, merr elementin e parë
      if (Array.isArray(statsData) && statsData.length > 0) {
        return statsData[0];
      }
      
      // Nëse është object, përdor direkt  
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
