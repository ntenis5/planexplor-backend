// src/services/cacheMaintenance.ts
import { logger } from '../utils/logger.js'; // FIKSUAR: Importimi i logger-it

import { cacheService } from './cacheService.js';
import * as os from 'os'; // Përdorur për qëndrueshmëri

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Starts a scheduled cache cleanup process.
   */
  startScheduledCleanup() {
    this.cleanupInterval = setInterval(async () => {
      try {
        // Zëvendësuar console.log me logger.info
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
