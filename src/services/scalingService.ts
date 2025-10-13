import { supabase } from './supabaseClient.js'; 

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

      const strategyData = data as any;
      
      if (error || !strategyData) {
        if (error) console.error("Supabase RPC Error:", error);
        return this.getDefaultStrategy();
      }
      
      if (Array.isArray(strategyData) && strategyData.length > 0) {
        return strategyData[0] as CacheStrategy;
      }
      
      if (typeof strategyData === 'object' && strategyData !== null) {
        return strategyData as CacheStrategy;
      }
      
      return this.getDefaultStrategy();

    } catch (error) {
      console.error('Error in getAdaptiveCacheStrategy:', error);
      return this.getDefaultStrategy();
    }
  }

  async getCacheStrategy(endpoint: string, userRegion: string = 'eu'): Promise<CacheStrategy> {
    return this.getAdaptiveCacheStrategy(endpoint, userRegion);
  }

  async validateCacheAccess(cacheKey: string, permissions: string[]): Promise<boolean> {
    try {
      const hasValidPermission = permissions.includes('authenticated');
      return hasValidPermission && typeof cacheKey === 'string' && cacheKey.length > 0;
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
