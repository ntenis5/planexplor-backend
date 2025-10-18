import { supabase } from './supabaseClient.js';
export class ScalingService {
    async getAdaptiveCacheStrategy(endpoint, userRegion = 'eu') {
        try {
            const { data, error } = await supabase
                .rpc('get_adaptive_cache_strategy', {
                endpoint_path: endpoint,
                user_region: userRegion,
                request_time: new Date().toISOString()
            });
            const strategyData = data;
            if (error || !strategyData) {
                if (error)
                    console.error("Supabase RPC Error:", error);
                return this.getDefaultStrategy();
            }
            if (Array.isArray(strategyData) && strategyData.length > 0) {
                return strategyData[0];
            }
            if (typeof strategyData === 'object' && strategyData !== null) {
                return strategyData;
            }
            return this.getDefaultStrategy();
        }
        catch (error) {
            console.error('Error in getAdaptiveCacheStrategy:', error);
            return this.getDefaultStrategy();
        }
    }
    async getCacheStrategy(endpoint, userRegion = 'eu') {
        return this.getAdaptiveCacheStrategy(endpoint, userRegion);
    }
    async validateCacheAccess(cacheKey, permissions) {
        try {
            const hasValidPermission = permissions.includes('authenticated');
            return hasValidPermission && typeof cacheKey === 'string' && cacheKey.length > 0;
        }
        catch (error) {
            console.error('Error in validateCacheAccess:', error);
            return false;
        }
    }
    async checkScalingNeeds() {
        try {
            const { data, error } = await supabase
                .rpc('check_scaling_needs');
            return error ? { scaling_actions: [] } : data;
        }
        catch (error) {
            console.error('Error in checkScalingNeeds:', error);
            return { scaling_actions: [] };
        }
    }
    async runCacheMaintenance() {
        try {
            const { data, error } = await supabase
                .rpc('smart_cache_cleanup');
            return error ? { status: 'failed' } : data;
        }
        catch (error) {
            console.error('Error in runCacheMaintenance:', error);
            return { status: 'failed' };
        }
    }
    getDefaultStrategy() {
        return {
            ttl_minutes: 60,
            priority: 3,
            strategy: 'default'
        };
    }
}
export const scalingService = new ScalingService();
