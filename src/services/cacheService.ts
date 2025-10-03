import { supabase, SearchCache } from './supabaseClient';
import { updateAffiliateData } from './affiliateService';
import nodeCron from 'node-cron';

// Cache search results for 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, any> = new Map();

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async getFromCache(key: string): Promise<any> {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check database cache
    const { data, error } = await supabase
      .from('search_cache')
      .select('*')
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Store in memory cache
    this.cache.set(key, data.data);
    return data.data;
  }

  async setToCache(key: string, data: any): Promise<void> {
    const expiresAt = new Date(Date.now() + CACHE_DURATION);

    // Store in memory
    this.cache.set(key, data);

    // Store in database
    await supabase
      .from('search_cache')
      .upsert({
        key,
        data,
        expires_at: expiresAt.toISOString(),
        last_updated: new Date().toISOString()
      });
  }

  async clearExpiredCache(): Promise<void> {
    await supabase
      .from('search_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    // Clear memory cache periodically
    this.cache.clear();
  }
}

// Initialize cache and schedule updates
export async function initializeCache() {
  const cacheService = CacheService.getInstance();
  
  // Clear expired cache on startup
  await cacheService.clearExpiredCache();
  
  // Update affiliate data every 6 hours
  nodeCron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Updating affiliate cache...');
    try {
      await updateAffiliateData();
      console.log('✅ Affiliate cache updated successfully');
    } catch (error) {
      console.error('❌ Failed to update affiliate cache:', error);
    }
  });

  // Clear expired cache daily
  nodeCron.schedule('0 2 * * *', async () => {
    await cacheService.clearExpiredCache();
  });
}
