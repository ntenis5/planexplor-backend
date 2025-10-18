import { supabase } from './supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';
export class AnalyticsService {
    async logDetailedRequest(metric) {
        try {
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
        catch (error) {
            console.error('Error in logDetailedRequest:', error);
        }
    }
    async captureRequest(metric) {
        try {
            await this.logDetailedRequest({
                sessionId: undefined,
                userId: metric.user_id,
                endpoint: metric.endpoint,
                method: metric.method,
                status: metric.status_code,
                responseTime: metric.latency_ms,
                cacheStatus: 'skip',
                cacheStrategy: 'default',
                userAgent: undefined,
                userIp: undefined
            });
        }
        catch (error) {
            console.error('Error in captureRequest:', error);
        }
    }
    getCountryFromIP(ip) {
        try {
            const geo = geoip.lookup(ip);
            return geo?.country || null;
        }
        catch {
            return null;
        }
    }
    getDeviceType(userAgent) {
        try {
            if (/mobile/i.test(userAgent))
                return 'mobile';
            if (/tablet/i.test(userAgent))
                return 'tablet';
            return 'desktop';
        }
        catch {
            return 'desktop';
        }
    }
    calculateApiCost(endpoint, cacheStatus) {
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
    async checkAnomalies(data) {
        try {
            const anomalies = {
                hasAnomalies: false,
                details: [],
                timestamp: new Date().toISOString()
            };
            if (data?.response_time_ms > 5000) {
                anomalies.hasAnomalies = true;
                anomalies.details.push('High response time detected');
            }
            return anomalies;
        }
        catch (error) {
            console.error('Error in checkAnomalies:', error);
            return { hasAnomalies: false, details: [], timestamp: new Date().toISOString() };
        }
    }
    async generateDailyReport() {
        try {
            const { data, error } = await supabase
                .rpc('generate_daily_performance_report');
            return error ? null : data;
        }
        catch (error) {
            console.error('Error in generateDailyReport:', error);
            return null;
        }
    }
}
export const analyticsService = new AnalyticsService();
