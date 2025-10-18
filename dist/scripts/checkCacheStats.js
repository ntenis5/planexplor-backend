import { supabase } from '../services/supabaseClient.js';
async function checkCacheStats() {
    console.log('Checking Cache Statistics...');
    try {
        const { data: rawData, error } = await supabase.rpc('get_cache_stats');
        if (error) {
            console.error('Failed to get stats:', error.message);
            return;
        }
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        if (!data || typeof data.total_entries === 'undefined') {
            console.log('Received invalid or empty stats data.');
            return;
        }
        console.log('=== CACHE STATISTICS ===');
        console.log(`Total Entries: ${data.total_entries}`);
        console.log(`Total Hits: ${data.total_hits}`);
        console.log(`Total Size: ${data.total_size_mb.toFixed(2)} MB`);
        console.log(`Hit Rate: ${data.hit_rate.toFixed(2)}%`);
        console.log('\n=== BY TYPE ===');
        if (data.by_type && typeof data.by_type === 'object') {
            Object.entries(data.by_type).forEach(([type, stats]) => {
                const typeStats = stats;
                console.log(`${type}: ${typeStats.count} entries, ${typeStats.hits} hits, avg ${typeStats.avg_hits.toFixed(2)} hits/entry`);
            });
        }
        else {
            console.log('No detailed type statistics available.');
        }
    }
    catch (error) {
        console.error('Stats check failed:', error);
    }
}
checkCacheStats();
