import { supabase } from '../services/supabaseClient.js';

interface CleanupResult {
  total_deleted: number;
  expired_deleted: number;
  low_priority_deleted: number;
  cleaned_at: string;
}

async function runCacheCleanup(): Promise<void> {
  console.log('Running Smart Cache Cleanup...');
  
  try {
    // RREGULLIMI KRYESOR: Shto një argument bosh {}
    const { data: rawData, error } = await supabase.rpc('smart_cache_cleanup', {}); 
    
    if (error) {
      // Në vend të error.message, shtojmë edhe detajet për të ndihmuar diagnostikimin
      console.error('Cleanup failed:', error); 
      return;
    }

    // Pjesa tjetër e kodit mbetet e njëjtë
    const data: CleanupResult = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!data || typeof data.total_deleted === 'undefined') {
        console.log('Received invalid or empty cleanup data.');
        return;
    }

    console.log('Cleanup completed:');
    console.log(`- Total deleted entries: ${data.total_deleted}`);
    console.log(`- Expired entries deleted: ${data.expired_deleted}`);
    console.log(`- Low priority entries deleted: ${data.low_priority_deleted}`);
    console.log(`- Cleaned at: ${data.cleaned_at}`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// RUANI KËTË KOD JASHTË APP.TS
// Kujdes: Kjo thirrje duhet të zhvendoset brenda një shërbimi (p.sh., cacheService.cleanupCache())
// dhe të thirret nga cacheMaintenance.js, jo në nivelin e lartë.
// Nëse e përdorni si skript, ajo ekzekutohet dhe mbyllet menjëherë!
// runCacheCleanup();
