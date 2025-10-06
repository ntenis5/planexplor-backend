import express from 'express';
import { AffiliateService } from '../services/affiliateService';
import { CacheService } from '../services/cacheService'; // KONTROLLOJE KËTË IMPORT!

const router = express.Router();
const affiliateService = new AffiliateService();
// Inicializo shërbimin e Caching-ut
const cacheService = CacheService.getInstance(); 

/**
 * Funksioni për të krijuar një Çelës Unik Cache-i
 * Përdor JSON.stringify me çelësa të renditur për të garantuar unikalitetin
 * pavarësisht nga rendi i hyrjes.
 */
function generateCacheKey(params: any): string {
    // Rendit çelësat e hyrjes për të siguruar konsistencë
    const sortedKeys = Object.keys(params).sort();
    
    // Kthe objektin në string me renditje
    const sortedParamsString = JSON.stringify(params, sortedKeys);
    
    // Çelësi i cache-it (i ruajtur në Supabase ose në RAM)
    return `search_results_${sortedParamsString}`;
}


router.post('/', async (req, res) => {
  let isCached = false; // Treguesi që tregon nëse u shërbye nga cache
  
  try {
    const {
      category = 'all',
      destination,
      distance = 0,
      budget = 0,
      persons = 0,
      check_in,
      check_out,
      user_location
    } = req.body;

    // 1. Validimi i Detyrueshëm
    if (!destination || !user_location) {
      return res.status(400).json({
        error: 'Destination and user location are required'
      });
    }

    const searchParams = {
      category,
      destination,
      distance: Number(distance),
      budget: Number(budget),
      persons: Number(persons),
      check_in,
      check_out,
      user_location
    };

    const cacheKey = generateCacheKey(searchParams);

    // 2. HAPI KRITIK: KONTROLLO CACHE-IN
    const cachedResults = await cacheService.getFromCache(cacheKey);

    if (cachedResults) {
        console.log(`✅ Kërkesa u shërbye nga Cache: ${cacheKey}`);
        isCached = true;
        
        // Kthe përgjigjen MENJËHERË (Performanca maksimale & Kosto 0)
        return res.json({
            results: cachedResults,
            metadata: { 
                // Zëvendësoje këtë me metadata dinamike nga cachedResults
                total_results: cachedResults.length,
                category,
                search_center: user_location
            },
            cache_info: {
                cached: true,
                last_updated: new Date().toISOString()
            }
        });
    }

    // 3. NËSE S'KA CACHE: Ekzekuto kërkesën e vërtetë
    const results = await affiliateService.search(searchParams);

    // 4. RUAJ NË CACHE për herën tjetër
    if (results.length > 0) {
        await cacheService.setToCache(cacheKey, results);
        console.log(`💾 Rezultati i ri u ruajt në Cache: ${cacheKey}`);
    }

    // 5. Kthe përgjigjen origjinale
    res.json({
      results,
      metadata: {
        total_results: results.length,
        category,
        budget_range: budget ? {
          min: budget * 0.8,
          max: budget,
          user_input: budget
        } : null,
        distance_range: distance ? `0-${distance}km` : 'Any distance',
        search_center: user_location
      },
      cache_info: {
        cached: isCached, // Do të jetë false
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Internal server error during search'
    });
  }
});

export default router;
