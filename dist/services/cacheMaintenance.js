import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js';
export class CacheMaintenance {
    cleanupInterval = null;
    startScheduledCleanup() {
        logger.info('Starting scheduled cache cleanup interval...');
        this.runInitialCleanup();
        this.cleanupInterval = setInterval(async () => {
            try {
                logger.info('Running scheduled cache cleanup...');
                const result = await cacheService.cleanupCache();
                logger.info('Cache cleanup completed:', { result });
            }
            catch (error) {
                logger.error('Scheduled cache cleanup failed:', { error });
            }
        }, 6 * 60 * 60 * 1000);
    }
    async runInitialCleanup() {
        await new Promise(resolve => setTimeout(resolve, 50));
        try {
            console.log('INFO: Running initial cache cleanup...');
            const result = await cacheService.cleanupCache();
            console.log('INFO: Initial cache cleanup completed:', { result });
        }
        catch (error) {
            console.error('ERROR: Initial cache cleanup failed:', { error });
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
