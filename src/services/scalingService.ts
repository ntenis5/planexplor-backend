// src/services/scalingService.ts
import { supabase } from './supabaseClient.js';

export class ScalingService {
  
  async getAdaptiveCacheStrategy(endpoint: string, userRegion: string = 'eu'): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_adaptive_cache_strategy', {
        endpoint_path: endpoint,
        user_region: userRegion,
        request_time: new Date().toISOString()
      });

    return error ? this.getDefaultStrategy() : data;
  }

  async checkScalingNeeds(): Promise<any> {
    const { data, error } = await supabase
      .rpc('check_scaling_needs');

    return error ? { scaling_actions: [] } : data;
  }

  async runCacheMaintenance(): Promise<any> {
    const { data, error } = await supabase
      .rpc('smart_cache_cleanup');

    return error ? { status: 'failed' } : data;
  }

  private getDefaultStrategy() {
    return {
      ttl_minutes: 60,
      priority: 3,
      strategy: 'default'
    };
  }
}

export const scalingService = new ScalingService();
