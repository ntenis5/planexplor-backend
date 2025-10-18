import { Router, Request, Response } from 'express';
// Importet me '.js' janë ruajtur si rregullimi i duhur për gabimin fillestar.
import { travelPayoutsService } from '../services/travelpayoutsService.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

const flightsRouter = Router();

console.log('🔴 DEBUG: flights.ts loaded with REAL services for PRODUCTION!');

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

// ✅ SEARCH FLIGHTS (Tani në rrugën bazë: /api/v1/flights?origin=...)
flightsRouter.get('/', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: Root /flights endpoint called for SEARCH');
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query;

  // Nëse nuk ka parametra kryesorë (origin, destination, departDate), provojmë të trajtojmë kërkesat pa query
  if (!origin && !destination && !departDate) {
      // Le të vazhdojë nëse është thirrur thjesht /api/v1/flights pa query, 
      // sepse ndoshta është bërë gabim ose për arsye tjetër
      return res.status(200).json({ 
          message: 'Flights API is active. Use /cheapest, /suggestions, /airports, or add query params to search (e.g., ?origin=TIA&destination=VIE&departDate=YYYY-MM-DD).'
      });
  }

  // Tani vazhdojmë me logjikën e kërkimit (search)
  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination and depart date are required for a flight search' 
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

// ✅ CHEAPEST FLIGHTS (Mbetet: /api/v1/flights/cheapest)
flightsRouter.get('/cheapest', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /cheapest endpoint called');
  const { origin, destination } = req.query;
  // ... pjesa tjetër e kodit pa ndryshim ...

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

// ✅ SUGGESTIONS (Mbetet: /api/v1/flights/suggestions)
flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /suggestions endpoint called');
  const { query } = req.query;

  // ... pjesa tjetër e kodit pa ndryshim ...
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

// ✅ AIRPORTS (Mbetet: /api/v1/flights/airports)
flightsRouter.get('/airports', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /airports endpoint called');
  // ... pjesa tjetër e kodit pa ndryshim ...
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
