// src/services/cacheMaintenance.ts
import { logger } from '../utils/logger.js'; // ZGJIDHUR: Importon modulin e ri logger

import { cacheService } from './cacheService.js';
import * as os from 'os';

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Starts a scheduled cache cleanup process.
   */
  startScheduledCleanup() {
    // Clean up cache every 6 hours
    this.cleanupInterval = setInterval(async () => {
      try {
        // Zëvendësuar console.log
        logger.info('🔄 Running scheduled cache cleanup...'); 
        const result = await cacheService.cleanupCache();
        // Zëvendësuar console.log
        logger.info('✅ Cache cleanup completed:', { result });
      } catch (error) {
        // Zëvendësuar console.error
        logger.error('❌ Cache cleanup failed:', { error });
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
      // Zëvendësuar console.log
      logger.info('🛑 Scheduled cache cleanup stopped.');
    }
  }
}

export const cacheMaintenance = new CacheMaintenance();
