// src/services/cacheMaintenance.ts
import { cacheService } from './cacheService.js';
import * as os from 'os'; // Added for Node.js typing consistency with global objects like NodeJS.Timeout

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Starts a scheduled cache cleanup process.
   */
  startScheduledCleanup() {
    // Clean up cache every 6 hours
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled cache cleanup...');
        const result = await cacheService.cleanupCache();
        console.log('✅ Cache cleanup completed:', result);
      } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Stops the scheduled cache cleanup process.
   */
  stopScheduledCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Scheduled cache cleanup stopped.');
    }
  }
}

export const cacheMaintenance = new CacheMaintenance();
