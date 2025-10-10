// src/routes/affiliate.ts
import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

// Krijo router-in
const affiliateRouter = Router();

// Interface për rezultatet e kërkimit
interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

interface HotelResult {
  id: string;
  name: string;
  price: number;
  rating: number;
  location: string;
}

interface ActivityResult {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface CombinedResults {
  hotels: HotelResult[];
  activities: ActivityResult[];
  timestamp: string;
}

// Mock services - do t'i zëvendësoni me shërbimet tuaja aktuale
const bookingService = {
  async searchHotels(params: SearchParams): Promise<HotelResult[]> {
    // Implementimi mock - zëvendëso me API të vërtetë
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
  async searchActivities(params: { location?: string }): Promise<ActivityResult[]> {
    // Implementimi mock - zëvendëso me API të vërtetë
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

affiliateRouter.get('/search', async (req: Request, res: Response) => {
  const { destination, checkIn, checkOut, guests } = req.query as SearchParams;
  
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

    const combinedResults: CombinedResults = {
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

// Endpoint shtesë për të marrë oferta të populara
affiliateRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'affiliate_popular_deals';
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey,
      'affiliate_popular',
      'eu'
    );

    if (cachedResults.status === 'hit') {
      return res.json({
        deals: cachedResults.data,
        source: 'cache'
      });
    }

    // Mock data - zëvendëso me të dhëna reale
    const popularDeals = [
      {
        id: 'deal_1',
        title: 'Beach Vacation Package',
        price: 599,
        location: 'Albanian Riviera',
        image: 'https://picsum.photos/400/300?random=beach'
      }
    ];

    await enhancedCacheService.smartSet(
      cacheKey,
      popularDeals,
      'affiliate_popular',
      'eu'
    );

    res.json({
      deals: popularDeals,
      source: 'api'
    });

  } catch (error) {
    console.error('Popular deals error:', error);
    res.status(500).json({ error: 'Failed to fetch popular deals' });
  }
});

export default affiliateRouter;
