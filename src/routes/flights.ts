import { Router, Request, Response } from 'express';
import { travelPayoutsService } from '../services/travelpayoutsService.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

const flightsRouter = Router();

flightsRouter.get('/search', async (req: Request, res: Response) => {
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query;

  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination and depart date are required' 
    });
  }

  try {
    const cacheKey = `flights_${origin}_${destination}_${departDate}_${returnDate}_${adults}_${children}_${infants}`;
    
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

    console.log('Fetching fresh flights data from TravelPayouts...');
    
    const flights = await travelPayoutsService.searchFlights({
      origin: origin as string,
      destination: destination as string,
      departDate: departDate as string,
      returnDate: returnDate as string,
      adults: parseInt(adults as string) || 1,
      children: parseInt(children as string) || 0,
      infants: parseInt(infants as string) || 0
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

    if (cachedResults.status === 'hit') {
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
    console.error('Cheapest flights error:', error);
    res.status(500).json({ error: 'Failed to fetch cheapest flights' });
  }
});

flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
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

    if (cachedResults.status === 'hit') {
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
    console.error('Flight suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

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
