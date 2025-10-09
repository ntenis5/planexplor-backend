import type { Request, Response } from 'express'; 
// ✅ RREGULLIMI: Shtuar .js
import { AffiliateService } from '../services/affiliateService.js'; 
// ✅ RREGULLIMI: Shtuar .js
import { CacheService } from '../services/cacheService.js'; 

const affiliateService = new AffiliateService();
const cacheService = CacheService.getInstance(); 

// ⏳ Konstante: Koha e skadimit e rezultateve të kërkimit (30 minuta)
const SEARCH_CACHE_TTL = 30 * 60; // 1800 sekonda

/**
 * Krijon një çelës unik të cache-it nga parametrat e kërkimit.
 */
function generateCacheKey(params: any): string {
    // Përdorim JSON.stringify me një funksion zëvendësues (replacer function)
    // për të siguruar renditjen e çelësave nëse rendi i tyre ndryshon gjatë dërgimit.
    const sortedKeys = Object.keys(params).sort();
    const sortedParamsString = JSON.stringify(params, sortedKeys);
    return `search_results_${sortedParamsString}`;
}

/**
 * Funksioni Kryesor i Kërkimit. Përfshin logjikën e Caching-ut.
 */
export async function handleSearchRequest(req: Request, res: Response) {
    let isCached = false;
    // Për kërkesat POST, trupi duhet të jetë objekti (req.body)
    const body = req.body || {}; 
    
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
        } = body; 

        // 1. Validimi
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

        // 2. KONTROLLO CACHE-IN
        // ✅ RREGULLIMI: handleSearchRequest mund të mos ketë nevojë të japë TTL në getFromCache
        // vetëm nëse `getFromCache` është shkruar për të marrë vetëm 1 argument.
        // Për siguri, do të supozojmë versionin e rregulluar të cacheService që ne e dimë.
        const cachedResults = await cacheService.getFromCache(cacheKey); 
        // Nëse `getFromCache` pret 2 argumente (çelësin dhe TTL), përdorni: 
        // const cachedResults = await cacheService.getFromCache(cacheKey, SEARCH_CACHE_TTL);


        if (cachedResults) {
            isCached = true;
            console.log(`✅ Kërkesa u shërbye nga Cache: ${cacheKey}`);
            
            return res.status(200).json({
                results: cachedResults,
                metadata: { 
                    total_results: cachedResults.length, category, search_center: user_location
                },
                cache_info: { cached: true, last_updated: new Date().toISOString() }
            });
        }

        // 3. NËSE S'KA CACHE: Ekzekuto kërkesën e vërtetë
        const results = await affiliateService.search(searchParams);

        // 4. RUAJ NË CACHE
        if (results.length > 0) {
            // ✅ RREGULLIMI KRITIK: Shtuar SEARCH_CACHE_TTL si argumentin e dytë
            await cacheService.setToCache(cacheKey, results, SEARCH_CACHE_TTL); 
            console.log(`💾 Rezultati i ri u ruajt në Cache: ${cacheKey}`);
        }

        // 5. Kthe përgjigjen
        return res.status(200).json({
            results,
            metadata: {
                total_results: results.length, category,
                budget_range: budget ? { min: budget * 0.8, max: budget, user_input: budget } : null,
                distance_range: distance ? `0-${distance}km` : 'Any distance',
                search_center: user_location
            },
            cache_info: { cached: isCached, last_updated: new Date().toISOString() }
        });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            error: 'Internal server error during search'
        });
    }
}

// ZGJIDHJA e gabimit 'no default export':
export default handleSearchRequest;
