import type { Request, Response } from 'express'; 
import { AffiliateService } from '../services/affiliateService.js';
import { CacheService } from '../services/cacheService.js'; 

const affiliateService = new AffiliateService();
const cacheService = CacheService.getInstance(); 

/**
 * Krijon një çelës unik të cache-it nga parametrat e kërkimit.
 */
function generateCacheKey(params: any): string {
    const sortedKeys = Object.keys(params).sort();
    const sortedParamsString = JSON.stringify(params, sortedKeys);
    return `search_results_${sortedParamsString}`;
}

/**
 * Funksioni Kryesor i Kërkimit. Përfshin logjikën e Caching-ut.
 */
export async function handleSearchRequest(req: Request, res: Response) {
    let isCached = false;
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
            category, destination, distance: Number(distance), budget: Number(budget),
            persons: Number(persons), check_in, check_out, user_location
        };

        const cacheKey = generateCacheKey(searchParams);

        // 2. KONTROLLO CACHE-IN
        const cachedResults = await cacheService.getFromCache(cacheKey);

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
            await cacheService.setToCache(cacheKey, results);
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
    
