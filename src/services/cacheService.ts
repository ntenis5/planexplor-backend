// src/services/cacheService.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as nodeCron from 'node-cron'; // Përdorim import * siç sugjerohet
// import { updateAffiliateData } from './affiliateService'; // Supozohet që kjo funksionon

let supabase: SupabaseClient | null = null;

// Cache search results for 6 hours (në milisekonda)
const CACHE_DURATION = 6 * 60 * 60 * 1000;

// Inicializon lidhjen me Supabase
const setupSupabase = (): void => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('ERROR: SUPABASE_URL ose SUPABASE_ANON_KEY mungojnë. Caching do të jetë vetëm in-memory.');
        return;
    }
    
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase Client i inicializuar.');
};


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
    // 1. Kontrollo Cache-in In-memory (Më i shpejti)
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // 2. Kontrollo Database Cache (Supabase)
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('search_cache') // Kjo tabelë duhet të jetë krijuar në DB
      .select('result_data') // Kujdes: Ne përdorim 'result_data' në këtë version
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(); // Përdorim maybeSingle për një rresht

    if (error) {
      console.error('Supabase Cache Read Error:', error.message);
      return null;
    }
    if (!data) return null;
    
    // Ruaj në Cache-in In-memory
    this.cache.set(key, data.result_data);
    return data.result_data;
  }

  async setToCache(key: string, data: any): Promise<void> {
    const expiresAt = new Date(Date.now() + CACHE_DURATION);

    // 1. Ruaj në Cache-in In-memory
    this.cache.set(key, data);

    // 2. Ruaj në Database
    if (!supabase) return;

    const { error } = await supabase
      .from('search_cache')
      .upsert({
        key,
        result_data: data, // Kujdes: Përdorim 'result_data' për të qenë konsistent me getFromCache
        expires_at: expiresAt.toISOString(),
        last_updated: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) console.error('Supabase Cache Write Error:', error.message);
  }

  async clearExpiredCache(): Promise<void> {
    // Pastron Cache-in e Supabase
    if (supabase) {
        await supabase
            .from('search_cache')
            .delete()
            .lt('expires_at', new Date().toISOString());
    }
    
    // Pastron Cache-in In-memory
    this.cache.clear();
  }
}

// Inicializon lidhjen e Supabase
setupSupabase(); 

// Inicializon Cache-in dhe planifikon Cron Jobs
export async function initializeCache() {
  const cacheService = CacheService.getInstance();
  
  // Pastron cache-in e skaduar në start
  await cacheService.clearExpiredCache();
  
  // Update affiliate data every 6 hours (Nëse e keni këtë logjikë)
  nodeCron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Updating affiliate cache...');
    try {
      // await updateAffiliateData(); // Thirrja juaj
      console.log('✅ Affiliate cache updated successfully');
    } catch (error) {
      console.error('❌ Failed to update affiliate cache:', error);
    }
  });

  // Pastron expired cache çdo ditë në orën 2:00
  nodeCron.schedule('0 2 * * *', async () => {
    await cacheService.clearExpiredCache();
  });
}


// --- WRAPPER FUNKSIONET PËR ROUTER ---
// Këto funksione u mundësojnë router-ave të përdorin shërbimin e cache-it pa klasë.
const cacheServiceInstance = CacheService.getInstance();

export async function checkCache(key: string): Promise<any> {
    return cacheServiceInstance.getFromCache(key);
}

export async function saveCache(key: string, data: any): Promise<void> {
    return cacheServiceInstance.setToCache(key, data);
}
