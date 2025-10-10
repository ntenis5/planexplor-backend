// src/services/analyticsService.ts
import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';
import { UserAgent } from 'user-agents';

export class AnalyticsService {
  
  async logDetailedRequest(metric: {
    sessionId?: string;
    userId?: string;
    endpoint: string;
    method: string;
    status: number;
    responseTime: number;
    cacheStatus: 'hit' | 'miss' | 'skip';
    cacheStrategy?: string;
    userAgent?: string;
    userIp?: string;
  }): Promise<void> {
    const countryCode = metric.userIp ? this.getCountryFromIP(metric.userIp) : null;
    const deviceType = metric.userAgent ? this.getDeviceType(metric.userAgent) : null;
    const costEstimate = this.calculateApiCost(metric.endpoint, metric.cacheStatus);
    
    const { error } = await supabase
      .from('detailed_analytics')
      .insert({
        session_id: metric.sessionId || uuidv4(),
        user_id: metric.userId,
        endpoint_path: metric.endpoint,
        http_method: metric.method,
        response_status: metric.status,
        response_time_ms: metric.responseTime,
        cache_status: metric.cacheStatus,
        cache_strategy: metric.cacheStrategy,
        user_agent: metric.userAgent?.substring(0, 500),
        user_ip: metric.userIp,
        country_code: countryCode,
        device_type: deviceType,
        api_cost: costEstimate.totalCost,
        cache_savings: costEstimate.savings
      });

    if (error) {
      console.error('Analytics logging error:', error);
    }
  }

  private getCountryFromIP(ip: string): string | null {
    try {
      const geo = geoip.lookup(ip);
      return geo?.country || null;
    } catch {
      return null;
    }
  }

  private getDeviceType(userAgent: string): string {
    const agent = new UserAgent(userAgent);
    if (agent.data.deviceCategory === 'mobile') return 'mobile';
    if (agent.data.deviceCategory === 'tablet') return 'tablet';
    return 'desktop';
  }

  private calculateApiCost(endpoint: string, cacheStatus: string) {
    const costMap = {
      'geolocation_search': { cost: 0.0001, savings: 0.00008 },
      'reverse_geocode': { cost: 0.0002, savings: 0.00016 },
      'affiliate_feed': { cost: 0.001, savings: 0.0008 },
      'maps_tiles': { cost: 0.0005, savings: 0.0004 },
      'media_optimization': { cost: 0.0003, savings: 0.00025 }
    };

    const endpointCost = costMap[endpoint] || { cost: 0.0001, savings: 0.00008 };
    
    return {
      totalCost: cacheStatus === 'miss' ? endpointCost.cost : 0,
      savings: cacheStatus === 'hit' ? endpointCost.savings : 0
    };
  }

  async generateDailyReport(): Promise<any> {
    const { data, error } = await supabase
      .rpc('generate_daily_performance_report');

    return error ? null : data;
  }
}

export const analyticsService = new AnalyticsService();
