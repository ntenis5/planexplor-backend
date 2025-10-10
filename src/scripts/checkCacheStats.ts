// src/scripts/checkCacheStats.ts
import { supabase } from '../services/supabaseClient.js';

async function checkCacheStats() {
  console.log('📊 Checking Cache Statistics...');
  
  try {
    const { data, error } = await supabase.rpc('get_cache_stats');
    
    if (error) {
      console.error('❌ Failed to get stats:', error.message);
      return;
    }

    console.log('=== CACHE STATISTICS ===');
    console.log(`Total Entries: ${data.total_entries}`);
    console.log(`Total Hits: ${data.total_hits}`);
    console.log(`Total Size: ${data.total_size_mb} MB`);
    console.log(`Hit Rate: ${data.hit_rate}%`);
    
    console.log('\n=== BY TYPE ===');
    Object.entries(data.by_type).forEach(([type, stats]: [string, any]) => {
      console.log(`${type}: ${stats.count} entries, ${stats.hits} hits, avg ${stats.avg_hits} hits/entry`);
    });
    
  } catch (error) {
    console.error('❌ Stats check failed:', error);
  }
}

checkCacheStats();
