// src/scripts/runCacheCleanup.ts
import { supabase } from '../services/supabaseClient.js';

async function runCacheCleanup() {
  console.log('🧹 Running Cache Cleanup...');
  
  try {
    const { data, error } = await supabase.rpc('smart_cache_cleanup');
    
    if (error) {
      console.error('❌ Cleanup failed:', error.message);
      return;
    }

    console.log('✅ Cleanup completed:');
    console.log(`- Total deleted: ${data.total_deleted}`);
    console.log(`- Expired: ${data.expired_deleted}`);
    console.log(`- Low priority: ${data.low_priority_deleted}`);
    console.log(`- Cleaned at: ${data.cleaned_at}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

runCacheCleanup();
