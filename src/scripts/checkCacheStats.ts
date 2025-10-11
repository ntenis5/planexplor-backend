// src/scripts/checkCacheStats.ts
import { supabase } from '../services/supabaseClient.js';

/**
 * Interface for the expected structure of cache statistics data.
 */
interface TypeStats {
  count: number;
  hits: number;
  avg_hits: number;
}

interface CacheStats {
  total_entries: number;
  total_hits: number;
  total_size_mb: number;
  hit_rate: number;
  by_type: {
    [key: string]: TypeStats;
  };
}

/**
 * Fetches and displays real-time cache performance statistics.
 */
async function checkCacheStats(): Promise<void> {
  console.log('📊 Checking Cache Statistics...');
  
  try {
    // Call the RPC function to get stats
    const { data: rawData, error } = await supabase.rpc('get_cache_stats');
    
    if (error) {
      console.error('❌ Failed to get stats:', error.message);
      return;
    }

    // Since RPCs often return arrays even for single results, 
    // we'll normalize the data to the expected object structure.
    const data: CacheStats = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!data || typeof data.total_entries === 'undefined') {
        console.log('⚠️ Received invalid or empty stats data.');
        return;
    }

    console.log('=== CACHE STATISTICS ===');
    console.log(`Total Entries: ${data.total_entries}`);
    console.log(`Total Hits: ${data.total_hits}`);
    // Round size for readability
    console.log(`Total Size: ${data.total_size_mb.toFixed(2)} MB`); 
    // Round hit rate for readability
    console.log(`Hit Rate: ${data.hit_rate.toFixed(2)}%`); 
    
    console.log('\n=== BY TYPE ===');
    // Ensure data.by_type exists and is an object before iterating
    if (data.by_type && typeof data.by_type === 'object') {
        Object.entries(data.by_type).forEach(([type, stats]) => {
            // Type assertion to ensure 'stats' conforms to TypeStats structure
            const typeStats: TypeStats = stats as TypeStats; 
            console.log(`${type}: ${typeStats.count} entries, ${typeStats.hits} hits, avg ${typeStats.avg_hits.toFixed(2)} hits/entry`);
        });
    } else {
        console.log('No detailed type statistics available.');
    }
    
  } catch (error) {
    console.error('❌ Stats check failed:', error);
  }
}

checkCacheStats();
