import { logger } from '../utils/logger.js';
import { supabase } from './supabaseClient.js';
import { scalingService } from './scalingService.js';
export class EnhancedCacheService {
    async smartGet(cacheKey, endpoint, userRegion = 'eu') {
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
        }
        catch (error) {
            logger.error('Error in smartGet:', { error });
            return { status: 'error', data: null, strategy: null };
        }
    }
    async smartSet(cacheKey, data, endpoint, userRegion = 'eu') {
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
        }
        catch (error) {
            logger.error('Error in smartSet:', { error });
            return { success: false, strategy: null };
        }
    }
    getCacheType(endpoint) {
        if (endpoint.includes('geolocation'))
            return 'geo';
        if (endpoint.includes('affiliate'))
            return 'affiliate';
        if (endpoint.includes('maps'))
            return 'map';
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
        }
        catch (error) {
            logger.error('Error in getSystemHealth:', { error });
            return {
                scaling: {},
                performance: {},
                timestamp: new Date().toISOString()
            };
        }
    }
    async getPerformanceStats() {
        try {
            const { data, error } = await supabase.rpc('get_cache_stats');
            if (error || !data) {
                logger.error('Cache stats error:', { error });
                return {};
            }
            const statsData = data;
            if (Array.isArray(statsData) && statsData.length > 0) {
                return statsData[0];
            }
            if (typeof statsData === 'object' && statsData !== null) {
                return statsData;
            }
            return {};
        }
        catch (error) {
            logger.error('Error in getPerformanceStats:', { error });
            return {};
        }
    }
}
export const enhancedCacheService = new EnhancedCacheService();
