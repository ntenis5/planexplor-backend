// src/routes/affiliate.js (version i përditësuar)
import { bookingService } from '../services/bookingService.js';
import { tripadvisorService } from '../services/tripadvisorService.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

affiliateRouter.get('/search', async (req, res) => {
  const { destination, checkIn, checkOut, guests } = req.query;
  
  try {
    const cacheKey = `affiliate_search_${destination}_${checkIn}_${checkOut}_${guests}`;
    
    // 1. Provo cache fillimisht
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'affiliate_search', 
      'eu'
    );

    if (cachedResults.status === 'hit') {
      return res.json({ 
        results: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    // 2. Nëse nuk ka cache, bëj kërkesë te affiliate
    const [bookingResults, tripadvisorResults] = await Promise.all([
      bookingService.searchHotels({ destination, checkIn, checkOut, guests }),
      tripadvisorService.searchActivities({ location: destination })
    ]);

    const combinedResults = {
      hotels: bookingResults,
      activities: tripadvisorResults,
      timestamp: new Date().toISOString()
    };

    // 3. Ruaj në cache për 30 minuta
    await enhancedCacheService.smartSet(
      cacheKey,
      combinedResults,
      'affiliate_search',
      'eu'
    );

    res.json({
      results: combinedResults,
      source: 'api',
      cached: false
    });

  } catch (error) {
    console.error('Affiliate search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
