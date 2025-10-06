// src/routes/search.ts

import { AffiliateService } from '../services/affiliateService';
import { CacheService } from '../services/cacheService'; 
// Suponojmë që po përdorni një strukturë të ngjashme me Node.js/Express
// Përndryshe, përdorni formatin e funksionit tuaj aktual.

const affiliateService = new AffiliateService();
const cacheService = CacheService.getInstance(); 

/**
 * Funksioni për të krijuar një Çelës Unik Cache-i nga parametrat e kërkimit
 */
function generateCacheKey(params: any): string {
    // Rendit çelësat e hyrjes për të siguruar konsistencë
    const sortedKeys = Object.keys(params).sort();
    
    // Kthe objektin në string me renditje
    const sortedParamsString = JSON.stringify(params, sortedKeys);
    
    return `search_results_${sortedParamsString}`;
}


/**
 * Funksioni Kryesor i Kërkimit (Eksportohet si funksion i vetëm API)
 * Kjo zëvendëson router.post('/')
 */
export async function handleSearchRequest(req: any, res: any) {
    let isCached = false;
    
    // Nese nuk perdorni Express.js, req.body mund te jete e ndryshme, 
    // por supozojme qe po merr te dhenat POST nga trupi i kerkeses.
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
        } = body; // Perdorni body ne vend te req.body

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
            isCached = true;
            console.log(`✅ Kërkesa u shërbye nga Cache: ${cacheKey}`);
            
            // Kthe përgjigjen MENJËHERË
            return res.status(200).json({
                results: cachedResults,
                metadata: { 
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
        return res.status(200).json({
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
        return res.status(500).json({
            error: 'Internal server error during search'
        });
    }
}
// Kjo funksion tani duhet të lidhet me URL-në tuaj në konfigurimin e Railway (p.sh., /api/search)
