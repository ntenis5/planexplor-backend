import { logger } from '../utils/logger.js';
import { cacheService } from './cacheService.js'; 

export class CacheMaintenance {
  private cleanupInterval: NodeJS.Timeout | null = null;

  startScheduledCleanup() {
    logger.info('Starting scheduled cache cleanup interval...');
    
    // Thërret pastrimin fillestar asinkronisht pa bllokuar
    this.runInitialCleanup(); 

    // Konfiguron intervalin e pastrimit të rregullt
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

  // FUNKSIONI I RREGULLUAR PËR PASTUESHËM DHE STABILITET MË TË MIRË TË NISJES
  private async runInitialCleanup() {
      // Shtohet një pritje e shkurtër për të siguruar që serveri ka nisur plotësisht dëgjimin
      await new Promise(resolve => setTimeout(resolve, 50)); 
      
      try {
          // Përdor console.log për logimin e nisjes (më i sigurt se logger.info në fazat e hershme)
          console.log('INFO: Running initial cache cleanup...'); 
          
          const result = await cacheService.cleanupCache(); 
          
          // Përdor console.log për konfirmim
          console.log('INFO: Initial cache cleanup completed:', { result });
          
          // E rëndësishme: ASGJË NUK DUHET TË MBYLLË PROCESIN KËTU (process.exit, SIGTERM)
          
      } catch (error) {
          // Përdor console.error për gabimet kritike të nisjes
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
