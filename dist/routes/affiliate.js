import { Router } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
const affiliateRouter = Router();
const bookingService = {
    async searchHotels(params) {
        return [
            {
                id: 'hotel_1',
                name: 'Hotel Example',
                price: 120,
                rating: 4.5,
                location: params.destination || 'Unknown'
            }
        ];
    }
};
const tripadvisorService = {
    async searchActivities(params) {
        return [
            {
                id: 'activity_1',
                name: 'City Tour',
                price: 50,
                duration: '3 hours'
            }
        ];
    }
};
affiliateRouter.get('/search', async (req, res) => {
    const { destination, checkIn, checkOut, guests } = req.query;
    if (!destination) {
        return res.status(400).json({ error: 'Destination parameter is required' });
    }
    try {
        const cacheKey = `affiliate_search_${destination}_${checkIn || ''}_${checkOut || ''}_${guests || ''}`;
        const cachedResults = await enhancedCacheService.smartGet(cacheKey, 'affiliate_search', 'eu');
        if (cachedResults.status === 'hit' && cachedResults.data) {
            return res.json({
                results: cachedResults.data,
                source: 'cache',
                cached: true
            });
        }
        const [bookingResults, tripadvisorResults] = await Promise.all([
            bookingService.searchHotels({ destination, checkIn, checkOut, guests }),
            tripadvisorService.searchActivities({ location: destination })
        ]);
        const combinedResults = {
            hotels: bookingResults,
            activities: tripadvisorResults,
            timestamp: new Date().toISOString()
        };
        await enhancedCacheService.smartSet(cacheKey, combinedResults, 'affiliate_search', 'eu');
        res.json({
            results: combinedResults,
            source: 'api',
            cached: false
        });
    }
    catch (error) {
        console.error('Affiliate search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});
affiliateRouter.get('/popular', async (req, res) => {
    try {
        const cacheKey = 'affiliate_popular_deals';
        const cachedResults = await enhancedCacheService.smartGet(cacheKey, 'affiliate_popular', 'eu');
        if (cachedResults.status === 'hit' && cachedResults.data) {
            return res.json({
                deals: cachedResults.data,
                source: 'cache'
            });
        }
        const popularDeals = [
            {
                id: 'deal_1',
                title: 'Beach Vacation Package',
                price: 599,
                location: 'Albanian Riviera',
                image: 'https://picsum.photos/400/300?random=beach'
            }
        ];
        await enhancedCacheService.smartSet(cacheKey, popularDeals, 'affiliate_popular', 'eu');
        res.json({
            deals: popularDeals,
            source: 'api'
        });
    }
    catch (error) {
        console.error('Popular deals error:', error);
        res.status(500).json({ error: 'Failed to fetch popular deals' });
    }
});
export default affiliateRouter;
