// src/routes/flights.js - JavaScript i pastër
import { Router } from 'express';

const flightsRouter = Router();

console.log('🔴 DEBUG: flights.js loaded successfully!');

// DYNAMIC IMPORT PËR TRAVELPAYOUTS SERVICE
let travelPayoutsService;
let enhancedCacheService;

try {
  console.log('🔴 DEBUG: Starting dynamic imports...');
  
  // Import travelPayoutsService
  try {
    const travelModule = await import('../services/travelpayoutsService.js');
    travelPayoutsService = travelModule.travelPayoutsService;
    console.log('✅ travelPayoutsService loaded successfully');
  } catch (error) {
    console.error('❌ travelPayoutsService import failed:', error);
    travelPayoutsService = {
      getAirports: () => {
        console.log('🔴 Using fallback airports');
        return Promise.resolve([
          { code: 'TIA', name: 'Tirana International Airport', city: 'Tirana', country: 'Albania' },
          { code: 'LON', name: 'London Heathrow', city: 'London', country: 'UK' },
          { code: 'PAR', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France' }
        ]);
      },
      searchFlights: () => Promise.resolve([]),
      getCheapestFlights: () => Promise.resolve([]),
      getDestinationSuggestions: () => Promise.resolve([])
    };
  }

  // Import enhancedCacheService
  try {
    const cacheModule = await import('../services/enhancedCacheService.js');
    enhancedCacheService = cacheModule.enhancedCacheService;
    console.log('✅ enhancedCacheService loaded successfully');
  } catch (error) {
    console.error('❌ enhancedCacheService import failed:', error);
    enhancedCacheService = {
      smartGet: () => Promise.resolve({ status: 'miss', data: null }),
      smartSet: () => Promise.resolve({ success: true }),
      smartDelete: () => Promise.resolve({ success: true })
    };
  }

} catch (error) {
  console.error('🔴 DEBUG: Dynamic imports failed completely:', error);
}

// ✅ DEBUG - Kontrollo nëse services janë të importuar
console.log('🔴 DEBUG: travelPayoutsService type:', typeof travelPayoutsService);
console.log('🔴 DEBUG: enhancedCacheService type:', typeof enhancedCacheService);

// ✅ AIRPORTS ENDPOINT
flightsRouter.get('/airports', async (req, res) => {
  console.log('🔴 DEBUG: /airports endpoint called');
  try {
    const cacheKey = 'all_airports';
    
    // Provojmë cache fillimisht
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_airports', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      console.log('🔴 DEBUG: Serving airports from cache');
      return res.json({ 
        airports: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴 DEBUG: Fetching fresh airports data');
    const airports = await travelPayoutsService.getAirports();

    // Ruajmë në cache
    await enhancedCacheService.smartSet(
      cacheKey,
      airports,
      'flights_airports',
      'eu'
    );

    res.json({
      airports,
      source: 'api',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔴 DEBUG: Airports fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch airports',
      details: error.message 
    });
  }
});

// ✅ SEARCH FLIGHTS ENDPOINT
flightsRouter.get('/search', async (req, res) => {
  console.log('🔴 DEBUG: /search endpoint called');
  const { origin, destination, departDate, returnDate, adults, children, infants } = req.query;

  if (!origin || !destination || !departDate) {
    return res.status(400).json({ 
      error: 'Origin, destination, and depart date are required' 
    });
  }

  try {
    const cacheKey = `flights_${origin}_${destination}_${departDate}_${returnDate || ''}_${adults || '1'}_${children || '0'}_${infants || '0'}`;
    
    // Provojmë cache fillimisht
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_search', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      console.log('🔴 DEBUG: Serving flights from cache');
      return res.json({ 
        flights: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴 DEBUG: Fetching fresh flights data from API...');
    
    const flights = await travelPayoutsService.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      adults: parseInt(adults || '1'),
      children: parseInt(children || '0'),
      infants: parseInt(infants || '0')
    });

    // Ruajmë në cache
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

  } catch (error) {
    console.error('🔴 DEBUG: Flights search error:', error);
    res.status(500).json({ 
      error: 'Failed to search flights',
      details: error.message 
    });
  }
});

// ✅ CHEAPEST FLIGHTS ENDPOINT
flightsRouter.get('/cheapest', async (req, res) => {
  console.log('🔴 DEBUG: /cheapest endpoint called');
  const { origin, destination } = req.query;

  if (!origin) {
    return res.status(400).json({ error: 'Origin is required' });
  }

  try {
    const cacheKey = `cheapest_flights_${origin}_${destination || 'any'}`;
    
    // Provojmë cache fillimisht
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_cheapest', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      console.log('🔴 DEBUG: Serving cheapest flights from cache');
      return res.json({ 
        cheapestFlights: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴 DEBUG: Fetching fresh cheapest flights data');
    const cheapestFlights = await travelPayoutsService.getCheapestFlights(origin, destination);

    // Ruajmë në cache
    await enhancedCacheService.smartSet(
      cacheKey,
      cheapestFlights,
      'flights_cheapest', 
      'eu'
    );

    res.json({
      cheapestFlights,
      source: 'api',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔴 DEBUG: Cheapest flights error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cheapest flights',
      details: error.message 
    });
  }
});

// ✅ SUGGESTIONS ENDPOINT
flightsRouter.get('/suggestions', async (req, res) => {
  console.log('🔴 DEBUG: /suggestions endpoint called');
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const cacheKey = `flight_suggestions_${query.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Provojmë cache fillimisht
    const cachedResults = await enhancedCacheService.smartGet(
      cacheKey, 
      'flights_suggestions', 
      'eu'
    );

    if (cachedResults.status === 'hit' && cachedResults.data) {
      console.log('🔴 DEBUG: Serving suggestions from cache');
      return res.json({ 
        suggestions: cachedResults.data,
        source: 'cache',
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    console.log('🔴 DEBUG: Fetching fresh suggestions data');
    const suggestions = await travelPayoutsService.getDestinationSuggestions(query);

    // Ruajmë në cache
    await enhancedCacheService.smartSet(
      cacheKey,
      suggestions,
      'flights_suggestions',
      'eu'
    );

    res.json({
      suggestions,
      source: 'api',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔴 DEBUG: Flight suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suggestions',
      details: error.message 
    });
  }
});

// ✅ HEALTH CHECK ENDPOINT
flightsRouter.get('/health', async (req, res) => {
  console.log('🔴 DEBUG: /health endpoint called');
  try {
    // Test basic functionality
    const testAirports = await travelPayoutsService.getAirports();
    const cacheTest = await enhancedCacheService.smartGet('health_check', 'system', 'eu');
    
    res.json({
      status: 'healthy',
      services: {
        travelPayouts: typeof travelPayoutsService.getAirports === 'function',
        cache: typeof enhancedCacheService.smartGet === 'function',
        airportsCount: testAirports ? testAirports.length : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔴 DEBUG: Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('🔴 DEBUG: flights.js loaded successfully!');

export default flightsRouter;
