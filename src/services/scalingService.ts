// src/services/scalingService.ts
import { supabase } from './supabaseClient.js';

// Interface për strategjinë e cache
export interface CacheStrategy {
  ttl_minutes: number;
  priority: number;
  strategy: string;
  region?: string;
}

export class ScalingService {
  
  async getAdaptiveCacheStrategy(endpoint: string, userRegion: string = 'eu'): Promise<CacheStrategy> {
    try {
      const { data, error } = await supabase
        .rpc('get_adaptive_cache_strategy', {
          endpoint_path: endpoint,
          user_region: userRegion,
          request_time: new Date().toISOString()
        });

      return error ? this.getDefaultStrategy() : data;
    } catch (error) {
      console.error('Error in getAdaptiveCacheStrategy:', error);
      return this.getDefaultStrategy();
    }
  }

  // Metodë e re për enhancedCacheService - zëvendëson getCacheStrategy
  async getCacheStrategy(endpoint: string, userRegion: string = 'eu'): Promise<CacheStrategy> {
    return this.getAdaptiveCacheStrategy(endpoint, userRegion);
  }

  // Metodë e re për enhancedCacheService - zëvendëson validateCacheAccess
  async validateCacheAccess(cacheKey: string, permissions: string[]): Promise<boolean> {
    try {
      // Implementimi i thjeshtë - mund të kompleksohet sipas nevojës
      const hasValidPermission = permissions.includes('authenticated');
      return hasValidPermission && cacheKey.length > 0;
    } catch (error) {
      console.error('Error in validateCacheAccess:', error);
      return false;
    }
  }

  async checkScalingNeeds(): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('check_scaling_needs');

      return error ? { scaling_actions: [] } : data;
    } catch (error) {
      console.error('Error in checkScalingNeeds:', error);
      return { scaling_actions: [] };
    }
  }

  async runCacheMaintenance(): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('smart_cache_cleanup');

      return error ? { status: 'failed' } : data;
    } catch (error) {
      console.error('Error in runCacheMaintenance:', error);
      return { status: 'failed' };
    }
  }

  private getDefaultStrategy(): CacheStrategy {
    return {
      ttl_minutes: 60,
      priority: 3,
      strategy: 'default'
    };
  }
}

export const scalingService = new ScalingService();
