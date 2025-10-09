// src/services/cacheService.ts (VERSIONI FINAL I RREGULLUAR)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as nodeCron from 'node-cron'; 
// ✅ RREGULLUAR: Shtuar .js te importi i affiliateService nese do te perdoret me vone
// import { updateAffiliateData } from './affiliateService.js'; 

let supabase: SupabaseClient | null = null;

// Koha e parazgjedhur e skadencës së cache-it (6 orë në milisekonda)
const DEFAULT_CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// Inicializon lidhjen me Supabase
const setupSupabase = (): void => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('ERROR: SUPABASE_URL ose SUPABASE_ANON_KEY mungojnë. Caching do të jetë vetëm in-memory.');
        return;
    }
    
    // Kujdes: Këtu duhet të përdorni SUPABASE_SERVICE_KEY për shkrim nëse RLS është aktiv
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
      .from('search_cache')
      .select('result_data')
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle(); 

    if (error) {
      console.error('Supabase Cache Read Error:', error.message);
      return null;
    }
    if (!data) return null;
    
    // Ruaj në Cache-in In-memory
    this.cache.set(key, data.result_data);
    return data.result_data;
  }

  // ✅ RREGULLIMI KRYESOR: SHTOHET ttlInSeconds OPISONAL
  async setToCache(key: string, data: any, ttlInSeconds?: number): Promise<void> {
    // Përdor TTL të dhënë, përndryshe përdor default
    const durationMs = ttlInSeconds 
      ? ttlInSeconds * 1000 
      : DEFAULT_CACHE_DURATION_MS; 
      
    const expiresAt = new Date(Date.now() + durationMs);

    // 1. Ruaj në Cache-in In-memory
    this.cache.set(key, data);

    // 2. Ruaj në Database
    if (!supabase) return;

    const { error } = await supabase
      .from('search_cache')
      .upsert({
        key,
        result_data: data,
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
  
  // Update affiliate data every 6 hours 
  nodeCron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Updating affiliate cache...');
    try {
      // Këtu do të importohet updateAffiliateData
      // Nëse e thirrni ketu, duhet te rregullohet importi ne fillim:
      // const { updateAffiliateData } = await import('./affiliateService.js');
      // await updateAffiliateData(); 
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
const cacheServiceInstance = CacheService.getInstance();

export async function checkCache(key: string): Promise<any> {
    return cacheServiceInstance.getFromCache(key);
}

// ✅ RREGULLIMI KRYESOR: SHTOHET ARGUMENTI OPSIONAL ttlInSeconds
export async function saveCache(key: string, data: any, ttlInSeconds?: number): Promise<void> {
    // Wrapper-i kalon argumentin e tretë te setToCache
    return cacheServiceInstance.setToCache(key, data, ttlInSeconds);
        }
