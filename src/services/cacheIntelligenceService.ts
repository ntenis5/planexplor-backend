import { supabase } from './supabaseClient.js';

export class CacheIntelligenceService {
  
  async getOptimalTTL(endpoint: string, accessPattern: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_optimal_ttl', {
        pattern_text: `${endpoint}_${accessPattern}`,
        access_count: 100,
        total_days: 7
      });
    
    return error || data === null ? 60 : data;
  }

  async logAdvancedPerformance(metric: {
    endpoint: string;
    responseTime: number;
    cacheStatus: string;
    userLocation?: string;
    deviceType?: string;
    sessionId?: string;
  }): Promise<void> {
    const { error } = await supabase
      .rpc('log_performance', {
        endpoint_name: metric.endpoint,
        response_time_ms: metric.responseTime,
        cache_status: metric.cacheStatus
      });

    if (error) {
        console.error('Error logging advanced performance:', error);
    }
  }

  async getPerformanceDashboard(): Promise<any> {
    const { data, error } = await supabase
      .from('cache_performance_realtime')
      .select('*')
      .order('total_requests', { ascending: false });
    
    return error ? [] : data;
  }

  async getCostAnalysis(): Promise<any> {
    const { data, error } = await supabase
      .from('cost_savings_analysis')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(7);
    
    return error ? [] : data;
  }
}

export const cacheIntelService = new CacheIntelligenceService();
