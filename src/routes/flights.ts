import { Router, Request, Response } from 'express';

const flightsRouter = Router();

// DYNAMIC IMPORT PËR TË SHMANGUR EXTENSION PROBLEMET
let travelPayoutsService;
let enhancedCacheService;

console.log('🔴 DEBUG: flights.ts - Starting dynamic imports...');

try {
  const travelModule = await import('../services/travelpayoutsService');
  travelPayoutsService = travelModule.travelPayoutsService;
  console.log('✅ DEBUG: travelPayoutsService loaded successfully');
} catch (error) {
  console.error('❌ DEBUG: travelPayoutsService import failed:', error);
  // Fallback service
  travelPayoutsService = {
    getAirports: () => {
      console.log('🔴 DEBUG: Using fallback airports');
      return Promise.resolve([
        { code: 'TEST', name: 'Test Airport', city: 'Test City' }
      ]);
    },
    searchFlights: () => Promise.resolve([]),
    getCheapestFlights: () => Promise.resolve([]),
    getDestinationSuggestions: () => Promise.resolve([])
  };
}

try {
  const cacheModule = await import('../services/enhancedCacheService');
  enhancedCacheService = cacheModule.enhancedCacheService;
  console.log('✅ DEBUG: enhancedCacheService loaded successfully');
} catch (error) {
  console.error('❌ DEBUG: enhancedCacheService import failed:', error);
  // Fallback cache service
  enhancedCacheService = {
    smartGet: () => Promise.resolve({ status: 'miss', data: null }),
    smartSet: () => Promise.resolve({ success: true })
  };
}

console.log('🔴 DEBUG: flights.ts loaded successfully!');
console.log('🔴 DEBUG: travelPayoutsService type:', typeof travelPayoutsService);
console.log('🔴 DEBUG: enhancedCacheService type:', typeof enhancedCacheService);

// ✅ INTERFACES
interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  infants?: string;
}

interface SuggestionsParams {
  query?: string;
}

// ✅ SEARCH FLIGHTS
flightsRouter.get('/search', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /search endpoint called');
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query;

  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination and depart date are required' 
    });
  }

  try {
    const cacheKey = `flights_${origin}_${destination}_${departDate}_${returnDate || ''}_${adults || '1'}_${children || '0'}_${infants || '0'}`;
    
    console.log('🔴 DEBUG: Cache key:', cacheKey);
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_search', 
      'eu'
    );

    console.log('🔴 DEBUG: Cache result:', cachedResults.status);

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        flights: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴 DEBUG: Fetching fresh flights data from TravelPayouts...');
    
    const flights = await travelPayoutsService.searchFlights({
      origin: origin as string,
      destination: destination as string,
      departDate: departDate as string,
      returnDate: returnDate as string,
      adults: parseInt(adults as string) || 1,
      children: parseInt(children as string) || 0,
      infants: parseInt(infants as string) || 0
    });

    console.log('🔴 DEBUG: Flights received:', flights?.length || 0);

    await enhancedCacheService.smartSet(
      cacheKey,
      flights,
      'flights_search',
      'eu'
    );

    res.json({
      flights,
      source: 'api',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🔴 DEBUG: Flights search error:', error);
    res.status(500).json({ 
      error: 'Failed to search flights',
      details: error.message 
    });
  }
});

// ✅ CHEAPEST FLIGHTS
flightsRouter.get('/cheapest', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /cheapest endpoint called');
  const { origin, destination } = req.query;

  if (!origin) {
    return res.status(400).json({ error: 'Origin is required' });
  }

  try {
    const cacheKey = `cheapest_flights_${origin}_${destination || 'any'}`;
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_cheapest', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        cheapestFlights: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    const cheapestFlights = await travelPayoutsService.getCheapestFlights(
      origin as string, 
      destination as string
    );

    await enhancedCacheService.smartSet(
      cacheKey,
      cheapestFlights,
      'flights_cheapest', 
      'eu'
    );

    res.json({
      cheapestFlights,
      source: 'api',
      cached: false
    });

  } catch (error: any) {
    console.error('🔴 DEBUG: Cheapest flights error:', error);
    res.status(500).json({ error: 'Failed to fetch cheapest flights' });
  }
});

// ✅ SUGGESTIONS
flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /suggestions endpoint called');
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const cacheKey = `flight_suggestions_${query}`;
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_suggestions', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        suggestions: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    const suggestions = await travelPayoutsService.getDestinationSuggestions(query as string);

    await enhancedCacheService.smartSet(
      cacheKey,
      suggestions,
      'flights_suggestions',
      'eu'
    );

    res.json({
      suggestions,
      source: 'api',
      cached: false
    });

  } catch (error: any) {
    console.error('🔴 DEBUG: Flight suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// ✅ AIRPORTS
flightsRouter.get('/airports', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /airports endpoint called');
  try {
    const cacheKey = 'all_airports';
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_airports', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        airports: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    console.log('🔴 DEBUG: Fetching airports from TravelPayouts...');
    const airports = await travelPayoutsService.getAirports();
    console.log('🔴 DEBUG: Airports received:', airports?.length || 0);

    await enhancedCacheService.smartSet(
      cacheKey,
      airports,
      'flights_airports',
      'eu'
    );

    res.json({
      airports,
      source: 'api', 
      cached: false
    });

  } catch (error: any) {
    console.error('🔴 DEBUG: Airports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

export default flightsRouter;
