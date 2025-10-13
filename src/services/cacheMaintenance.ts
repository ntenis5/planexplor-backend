import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js';

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  startScheduledCleanup() {
    this.cleanupInterval = setInterval(async () => {
      try {
        logger.info('Running scheduled cache cleanup...'); 
        const result = await cacheService.cleanupCache();
        logger.info('Cache cleanup completed:', { result });
      } catch (error) {
        logger.error('Cache cleanup failed:', { error });
      }
    }, 6 * 60 * 60 * 1000);
  }

  stopScheduledCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Scheduled cache cleanup stopped.');
    }
  }
}

export const cacheMaintenance = new CacheMaintenance();
