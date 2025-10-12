// src/services/cacheMaintenance.ts
import { logger } from '../utils/logger.js'; // SHTUAR: Importi i logger-it

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
        logger.info('🔄 Running scheduled cache cleanup...'); // Zëvendësuar console.log
        const result = await cacheService.cleanupCache();
        logger.info('✅ Cache cleanup completed:', { result }); // Zëvendësuar console.log (e kalojmë rezultatin si objekt për logim të strukturuar)
      } catch (error) {
        logger.error('❌ Cache cleanup failed:', { error }); // Zëvendësuar console.error
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
      logger.info('🛑 Scheduled cache cleanup stopped.'); // Zëvendësuar console.log
    }
  }
}

export const cacheMaintenance = new CacheMaintenance();
