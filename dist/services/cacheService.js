import { supabase } from './supabaseClient.js';
export class CacheService {
    static instance;
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async manageCache(operation, key, data, options) {
        try {
            if (operation === 'get') {
                const { data: result, error } = await supabase
                    .rpc('cache_manager', {
                    operation: 'get',
                    key_text: key
                });
                if (error) {
                    console.error('Cache get error:', error);
                    return null;
                }
                return result?.status === 'hit' ? result.data : null;
            }
            else if (operation === 'set' && data) {
                const { error } = await supabase
                    .rpc('cache_manager', {
                    operation: 'set',
                    key_text: key,
                    data_json: data,
                    cache_type: options?.cacheType || 'api',
                    ttl_minutes: options?.ttl || 60
                });
                if (error) {
                    console.error('Cache set error:', error);
                    return false;
                }
                return true;
            }
            return null;
        }
        catch (error) {
            console.error('Cache service error:', error);
            return null;
        }
    }
    async getFromCache(key) {
        return this.manageCache('get', key);
    }
    async setToCache(key, value, ttl) {
        const ttlMinutes = ttl ? Math.ceil(ttl / 60) : 60;
        return this.manageCache('set', key, value, {
            ttl: ttlMinutes,
            cacheType: 'affiliate'
        });
    }
    async getGeolocationCache(query) {
        return this.manageCache('get', `geo_${query.toLowerCase().trim()}`);
    }
    async setGeolocationCache(query, data, ttl = 360) {
        return this.manageCache('set', `geo_${query.toLowerCase().trim()}`, data, {
            ttl: ttl,
            cacheType: 'geo'
        });
    }
    async getAffiliateCache(category, limit) {
        return this.manageCache('get', `affiliate_${category}_${limit}`);
    }
    async setAffiliateCache(category, limit, data) {
        return this.manageCache('set', `affiliate_${category}_${limit}`, data, {
            ttl: 30,
            cacheType: 'affiliate'
        });
    }
    async getCacheStats() {
        const { data, error } = await supabase
            .rpc('get_cache_stats');
        if (error) {
            console.error('Cache stats error:', error);
            return null;
        }
        return data;
    }
    async cleanupCache() {
        const { data, error } = await supabase
            .rpc('smart_cache_cleanup', {});
        if (error) {
            console.error('Cache cleanup error:', error);
            return null;
        }
        return data;
    }
}
export const cacheService = CacheService.getInstance();
