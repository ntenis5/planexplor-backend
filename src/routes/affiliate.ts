// src/routes/affiliate.ts
import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

// Create the router
const affiliateRouter = Router();

// Interface for search query parameters
interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

// Interface for hotel results structure
interface HotelResult {
  id: string;
  name: string;
  price: number;
  rating: number;
  location: string;
}

// Interface for activity results structure
interface ActivityResult {
  id: string;
  name: string;
  price: number;
  duration: string;
}

// Interface for the final combined search results
interface CombinedResults {
  hotels: HotelResult[];
  activities: ActivityResult[];
  timestamp: string;
}

// Mock services - will be replaced with your actual services
const bookingService = {
  async searchHotels(params: SearchParams): Promise<HotelResult[]> {
    // Mock implementation - replace with actual Booking.com API call
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
    // Mock implementation - replace with actual TripAdvisor API call
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
  // Extract and cast query parameters to the defined interface
  const { destination, checkIn, checkOut, guests } = req.query as SearchParams;
  
  if (!destination) {
    return res.status(400).json({ error: 'Destination parameter is required' });
  }

  try {
    // Create a unique cache key based on search parameters
    const cacheKey = `affiliate_search_${destination}_${checkIn || ''}_${checkOut || ''}_${guests || ''}`;
    
    // 1. Try to fetch from cache first
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'affiliate_search', 
      'eu' // Assuming 'eu' as default region
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        results: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    // 2. If cache miss, make requests to affiliate partners
    const [bookingResults, tripadvisorResults] = await Promise.all([
      bookingService.searchHotels({ destination, checkIn, checkOut, guests }),
      tripadvisorService.searchActivities({ location: destination })
    ]);

    const combinedResults: CombinedResults = {
      hotels: bookingResults,
      activities: tripadvisorResults,
      timestamp: new Date().toISOString()
    };

    // 3. Store the fresh results in cache
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

// Additional endpoint to fetch popular deals
affiliateRouter.get('/popular', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'affiliate_popular_deals';
    
    // 1. Try cache
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey,
      'affiliate_popular',
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({
        deals: cachedResults.data,
        source: 'cache'
      });
    }

    // 2. If cache miss, fetch/generate data
    // Mock data - replace with real data fetching logic
    const popularDeals = [
      {
        id: 'deal_1',
        title: 'Beach Vacation Package',
        price: 599,
        location: 'Albanian Riviera',
        image: 'https://picsum.photos/400/300?random=beach'
      }
    ];

    // 3. Set cache
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
