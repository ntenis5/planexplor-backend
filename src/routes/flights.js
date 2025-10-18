import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

const flightsRouter = Router();

console.log('🔴 DEBUG: flights.js loaded successfully!'); // ✅ DEBUG 1

// DYNAMIC IMPORT PËR TRAVELPAYOUTS SERVICE
let travelPayoutsService;
try {
  const module = await import('../services/travelpayoutsService.js');
  travelPayoutsService = module.travelPayoutsService;
  console.log('✅ travelPayoutsService loaded successfully');
} catch (error) {
  console.error('❌ travelPayoutsService load failed:', error);
  // Fallback service
  travelPayoutsService = {
    getAirports: () => {
      console.log('🔴 Using fallback airports');
      return Promise.resolve([]);
    },
    searchFlights: () => Promise.resolve([]),
    getCheapestFlights: () => Promise.resolve([]),
    getDestinationSuggestions: () => Promise.resolve([])
  };
}

// ✅ DEBUG 2 - Kontrollo nëse services janë të importuar
console.log('🔴 DEBUG: travelPayoutsService type:', typeof travelPayoutsService);
console.log('🔴 DEBUG: enhancedCacheService type:', typeof enhancedCacheService);

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

flightsRouter.get('/search', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /search endpoint called'); // ✅ DEBUG 3
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query as FlightSearchParams;

  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination, and depart date are required' 
    });
  }

  try {
    const cacheKey = `flights_${origin}_${destination}_${departDate}_${returnDate || ''}_${adults || '1'}_${children || '0'}_${infants || '0'}`;
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_search', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      return res.json({ 
        flights: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('Fetching fresh flights data from TravelPayouts...');
    
    const flights = await travelPayoutsService.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      adults: parseInt(adults || '1'),
      children: parseInt(children || '0'),
      infants: parseInt(infants || '0')
    });

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
    console.error('Flights search error:', error);
    res.status(500).json({ 
      error: 'Failed to search flights',
      details: error.message 
    });
  }
});

flightsRouter.get('/cheapest', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /cheapest endpoint called'); // ✅ DEBUG 4
  const { origin, destination } = req.query as FlightSearchParams;

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

    const cheapestFlights = await travelPayoutsService.getCheapestFlights(origin, destination);

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
    console.error('Cheapest flights error:', error);
    res.status(500).json({ error: 'Failed to fetch cheapest flights' });
  }
});

flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /suggestions endpoint called'); // ✅ DEBUG 5
  const { query } = req.query as SuggestionsParams;

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

    const suggestions = await travelPayoutsService.getDestinationSuggestions(query);

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
    console.error('Flight suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

flightsRouter.get('/airports', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /airports endpoint called'); // ✅ DEBUG 6
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

    const airports = await travelPayoutsService.getAirports();

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
    console.error('Airports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

export default flightsRouter;
