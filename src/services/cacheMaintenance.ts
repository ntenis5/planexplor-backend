import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js'; 

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  startScheduledCleanup() {
    logger.info('Starting scheduled cache cleanup interval...');
    
    this.runInitialCleanup(); 

    this.cleanupInterval = setInterval(async () => {
      try {
        logger.info('Running scheduled cache cleanup...'); 
        const result = await cacheService.cleanupCache(); 
        logger.info('Cache cleanup completed:', { result });
      } catch (error) {
        logger.error('Scheduled cache cleanup failed:', { error });
      }
    }, 6 * 60 * 60 * 1000); 
  }

  private async runInitialCleanup() {
      try {
          logger.info('Running initial cache cleanup...');
          const result = await cacheService.cleanupCache(); 
          logger.info('Initial cache cleanup completed:', { result });
      } catch (error) {
          logger.error('Initial cache cleanup failed:', { error });
      }
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
