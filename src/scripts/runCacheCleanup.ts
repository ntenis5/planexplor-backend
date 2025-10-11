// src/scripts/runCacheCleanup.ts
import { supabase } from '../services/supabaseClient.js';

/**
 * Interface for the expected structure of the cache cleanup result.
 */
interface CleanupResult {
  total_deleted: number;
  expired_deleted: number;
  low_priority_deleted: number;
  cleaned_at: string; // ISO 8601 timestamp
}

/**
 * Executes the smart cache cleanup routine via Supabase RPC.
 */
async function runCacheCleanup(): Promise<void> {
  console.log('🧹 Running Smart Cache Cleanup...');
  
  try {
    // Call the RPC function to initiate smart cleanup
    const { data: rawData, error } = await supabase.rpc('smart_cache_cleanup');
    
    if (error) {
      console.error('❌ Cleanup failed:', error.message);
      return;
    }

    // Normalize the data as RPCs often return arrays
    const data: CleanupResult = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!data || typeof data.total_deleted === 'undefined') {
        console.log('⚠️ Received invalid or empty cleanup data.');
        return;
    }

    console.log('✅ Cleanup completed:');
    console.log(`- Total deleted entries: ${data.total_deleted}`);
    console.log(`- Expired entries deleted: ${data.expired_deleted}`);
    console.log(`- Low priority entries deleted: ${data.low_priority_deleted}`);
    console.log(`- Cleaned at: ${data.cleaned_at}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

runCacheCleanup();
