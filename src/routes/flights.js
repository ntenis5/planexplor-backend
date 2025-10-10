// src/routes/flights.ts
import { Router, Request, Response } from 'express';
import { travelPayoutsService } from '../services/travelpayoutsService.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

const flightsRouter = Router();

// Interface për parametrat e kërkimit
interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  adults?: string;
  children?: string;
  infants?: string;
}

// Interface për sugjerimet
interface SuggestionsParams {
  query?: string;
}

// 🔍 KËRKIM I FLUTURIMEVE
flightsRouter.get('/search', async (req: Request, res: Response) => {
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query as FlightSearchParams;

  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination and depart date are required' 
    });
  }

  try {
    const cacheKey = `flights_${origin}_${destination}_${departDate}_${returnDate}_${adults}_${children}_${infants}`;
    
    // 1. PROVO CACHE
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_search', 
      'eu'
    );

    if (cachedResults.status === 'hit') {
      return res.json({ 
        flights: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // 2. KËRKO FLUTURIME TË REJA
    console.log('🔄 Fetching fresh flights data from TravelPayouts...');
    
    const flights = await travelPayoutsService.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      adults: parseInt(adults || '1'),
      children: parseInt(children || '0'),
      infants: parseInt(infants || '0')
    });

    // 3. RUAJ NË CACHE (2 ORE PËR FLUTURIME)
    await enhancedCacheService.smartSet(
      cacheKey,
      flights,
      'flights_search',
      'eu'
      // NDRYSHUAR: Hiqe TTL parameter sepse smartSet merr vetëm 4 parametra
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

// 💰 FLUTURIME MË TË LIRA
flightsRouter.get('/cheapest', async (req: Request, res: Response) => {
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

    if (cachedResults.status === 'hit') {
      return res.json({ 
        cheapestFlights: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    const cheapestFlights = await travelPayoutsService.getCheapestFlights(origin, destination);

    // RUAJ NË CACHE (6 ORE PËR FLUTURIME TË LIRA)
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

// 🗺️ SUGJERIME DESTINACIONESH
flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
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

    if (cachedResults.status === 'hit') {
      return res.json({ 
        suggestions: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    const suggestions = await travelPayoutsService.getDestinationSuggestions(query);

    // RUAJ NË CACHE (24 ORE PËR SUGJERIME)
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

// 🏙️ LISTA E AEROPORTEVE
flightsRouter.get('/airports', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'all_airports';
    
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_airports', 
      'eu'
    );

    if (cachedResults.status === 'hit') {
      return res.json({ 
        airports: cachedResults.data,
        source: 'cache',
        cached: true
      });
    }

    const airports = await travelPayoutsService.getAirports();

    // RUAJ NË CACHE (1 JAVË PËR AEROPORTE)
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
