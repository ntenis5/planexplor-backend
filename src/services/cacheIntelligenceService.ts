// src/services/cacheIntelligenceService.ts
import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

export class CacheIntelligenceService {
  
  /**
   * Calculates the optimal Time-To-Live (TTL) for a specific endpoint based on access patterns.
   * @param endpoint The API endpoint path.
   * @param accessPattern A string representing the typical access pattern (e.g., 'high_frequency', 'weekend_peak').
   * @returns The calculated optimal TTL in seconds, defaults to 60 on error.
   */
  async getOptimalTTL(endpoint: string, accessPattern: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_optimal_ttl', {
        pattern_text: `${endpoint}_${accessPattern}`,
        access_count: 100,
        total_days: 7
      });
    
    // Default TTL is 60 seconds if RPC call fails or returns null
    return error || data === null ? 60 : data;
  }

  /**
   * Logs detailed performance metrics for intelligent cache decisions.
   * @param metric Detailed performance data.
   */
  async logAdvancedPerformance(metric: {
    endpoint: string;
    responseTime: number;
    cacheStatus: string;
    userLocation?: string;
    deviceType?: string;
    sessionId?: string;
  }): Promise<void> {
    // Note: The RPC call currently ignores userLocation, deviceType, and sessionId.
    // If these were intended to be logged, the 'log_performance' function in Supabase must be updated.
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

  /**
   * Fetches real-time cache performance data for the dashboard.
   * @returns An array of performance records or an empty array on error.
   */
  async getPerformanceDashboard(): Promise<any> {
    const { data, error } = await supabase
      .from('cache_performance_realtime')
      .select('*')
      .order('total_requests', { ascending: false });
    
    return error ? [] : data;
  }

  /**
   * Fetches the cost savings analysis report.
   * @returns An array of cost analysis records for the last 7 days or an empty array on error.
   */
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
