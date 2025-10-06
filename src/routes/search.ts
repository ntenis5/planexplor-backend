import express from 'express';
import { AffiliateService } from '../services/affiliateService';
import { CacheService } from '../services/cacheService'; // Importi i ri

const router = express.Router();
const affiliateService = new AffiliateService();
const cacheService = CacheService.getInstance(); // Inicializimi i CacheService

// Funksion i thjeshtë për të krijuar një çelës unik cache-i nga parametrat e hyrjes
// Ne perdorim JSON.stringify dhe nje Hash (ne prodhim) ose thjesht string-un (ketu)
function generateCacheKey(params: any): string {
    // Renditja e çelësave (keys) garanton që rendi i hyrjes mos ta prishë cache-in
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `search_results_${sortedParams}`;
}

router.post('/', async (req, res) => {
  let isCached = false;
  
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

    // 1. Validimi (Njesoj si më parë)
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

    // 2. KONTROLLO CACHE-IN (HAPI I RI DHE KRITIK)
    const cachedResults = await cacheService.getFromCache(cacheKey);

    if (cachedResults) {
        console.log(`✅ Search result served from Cache: ${cacheKey}`);
        isCached = true;
        // Kthe përgjigjen MENJËHERË pa goditur shërbimet e afiliuara
        return res.json({
            results: cachedResults,
            metadata: { 
                // ... (Metadata mbetet e njejte ose ndërtohet nga cachedResults) 
            },
            cache_info: {
                cached: true,
                // Kjo duhet të vijë nga baza e të dhënave, por për shpejtësi e lëmë si kjo:
                last_updated: new Date().toISOString() 
            }
        });
    }

    // 3. NËSE S'KA CACHE: Bëj kërkesën e vërtetë (Gjëja e shtrenjtë/e ngadaltë)
    const results = await affiliateService.search(searchParams);

    // 4. RUAJ NË CACHE
    // Ruaj rezultatin e kërkimit për përdorim të ardhshëm
    if (results.length > 0) {
        await cacheService.setToCache(cacheKey, results);
        console.log(`💾 Search result saved to Cache: ${cacheKey}`);
    }

    // 5. Kthe përgjigjen
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
        cached: isCached, // Tani eshte 'false'
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
