import { supabase } from './supabaseClient.js';
export class CacheIntelligenceService {
    async getOptimalTTL(endpoint, accessPattern) {
        const { data, error } = await supabase
            .rpc('calculate_optimal_ttl', {
            pattern_text: `${endpoint}_${accessPattern}`,
            access_count: 100,
            total_days: 7
        });
        return error || data === null ? 60 : data;
    }
    async logAdvancedPerformance(metric) {
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
    async getPerformanceDashboard() {
        const { data, error } = await supabase
            .from('cache_performance_realtime')
            .select('*')
            .order('total_requests', { ascending: false });
        return error ? [] : data;
    }
    async getCostAnalysis() {
        const { data, error } = await supabase
            .from('cost_savings_analysis')
            .select('*')
            .order('report_date', { ascending: false })
            .limit(7);
        return error ? [] : data;
    }
}
export const cacheIntelService = new CacheIntelligenceService();
