// src/services/cacheMaintenance.ts
import { cacheService } from './cacheService.js';

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  startScheduledCleanup() {
    // Pastro cache çdo 6 orë
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled cache cleanup...');
        const result = await cacheService.cleanupCache();
        console.log('✅ Cache cleanup completed:', result);
      } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 orë
  }

  stopScheduledCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const cacheMaintenance = new CacheMaintenance();
