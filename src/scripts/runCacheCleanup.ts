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
    const { data: rawData, error } = await supabase.rpc('smart_cache_cleanup');
    
    if (error) {
      console.error('Cleanup failed:', error.message);
      return;
    }

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

runCacheCleanup();
