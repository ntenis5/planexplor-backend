// src/services/enhancedCacheService.ts

private async getPerformanceStats() {
  try {
    const { data, error } = await supabase.rpc('get_cache_stats');
    
    if (error || !data) {
      console.error('Cache stats error:', error);
      return {};
    }

    // ✅ KORRIGJIM: Përdor 'as any' për të shmangur gabimet TypeScript
    const statsData = data as any;
    
    // Nëse është array, merr elementin e parë
    if (Array.isArray(statsData) && statsData.length > 0) {
      return statsData[0];
    }
    
    // Nëse është object, përdor direkt  
    if (typeof statsData === 'object' && statsData !== null) {
      return statsData;
    }
    
    return {};
    
  } catch (error) {
    console.error('Error in getPerformanceStats:', error);
    return {};
  }
}
