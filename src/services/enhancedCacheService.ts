// src/services/enhancedCacheService.ts
import { logger } from '../utils/logger.js'; // ZGJIDHUR: Importimi i logger-it

import { supabase } from './supabaseClient.js';
import { scalingService } from './scalingService.js';

export class EnhancedCacheService {
  
  /**
   * Retrieves data from the cache using an intelligent strategy.
   */
  async smartGet(cacheKey: string, endpoint: string, userRegion: string = 'eu') {
    try {
      const strategy = await scalingService.getCacheStrategy(endpoint, userRegion);
      const isValid = await scalingService.validateCacheAccess(cacheKey, ['authenticated']);
      
      if (!isValid) {
        return { status: 'invalid_access', data: null };
      }

      const { data, error } = await supabase
        .rpc('cache_manager', {
          operation: 'get',
          key_text: cacheKey
        });

      if (error || data?.status !== 'hit') {
        return { status: 'miss', data: null, strategy }; 
      }

      return { 
        status: 'hit', 
        data: data.data,
        strategy 
      };
    } catch (error) {
      // Zëvendësuar console.error
      logger.error('Error in smartGet:', { error });
      return { status: 'error', data: null, strategy: null };
    }
  }

  /**
   * Sets data in the cache using an intelligent strategy.
   */
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
      // Zëvendësuar console.error
      logger.error('Error in smartSet:', { error });
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
      // Zëvendësuar console.error
      logger.error('Error in getSystemHealth:', { error });
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
        // Zëvendësuar console.error
        logger.error('Cache stats error:', { error });
        return {};
      }

      const statsData = data as any;
      
      if (Array.isArray(statsData) && statsData.length > 0) {
        return statsData[0];
      }
      
      if (typeof statsData === 'object' && statsData !== null) {
        return statsData;
      }
      
      return {};
      
    } catch (error) {
      // Zëvendësuar console.error
      logger.error('Error in getPerformanceStats:', { error });
      return {};
    }
  }
}

export const enhancedCacheService = new EnhancedCacheService();
