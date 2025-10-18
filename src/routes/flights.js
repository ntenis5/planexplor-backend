import { Router, Request, Response } from 'express';

const flightsRouter = Router();

console.log('🔴 DEBUG: flights.js loaded successfully!');

// FALLBACK SERVICES - PA IMPORT
const travelPayoutsService = {
  getAirports: () => {
    console.log('🔴 DEBUG: Using fallback airports');
    return Promise.resolve([
      { code: 'TEST', name: 'Test Airport', city: 'Test City' },
      { code: 'LON', name: 'London Heathrow', city: 'London' },
      { code: 'PAR', name: 'Paris Charles de Gaulle', city: 'Paris' }
    ]);
  },
  searchFlights: () => Promise.resolve([]),
  getCheapestFlights: () => Promise.resolve([]),
  getDestinationSuggestions: () => Promise.resolve([])
};

const enhancedCacheService = {
  smartGet: () => Promise.resolve({ status: 'miss', data: null }),
  smartSet: () => Promise.resolve({ success: true })
};

// ✅ AIRPORTS ENDPOINT
flightsRouter.get('/airports', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /airports endpoint called');
  try {
    const airports = await travelPayoutsService.getAirports();
    
    res.json({
      airports,
      source: 'fallback', 
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🔴 DEBUG: Airports fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch airports' });
  }
});

// ✅ SUGGESTIONS ENDPOINT  
flightsRouter.get('/suggestions', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /suggestions endpoint called');
  const { query } = req.query;

  res.json({
    suggestions: [
      { destination: 'Paris', price: 100 },
      { destination: 'London', price: 150 },
      { destination: 'Rome', price: 200 }
    ],
    query: query,
    source: 'fallback',
    cached: false
  });
});

// ✅ CHEAPEST FLIGHTS
flightsRouter.get('/cheapest', async (req: Request, res: Response) => {
  console.log('🔴 DEBUG: /cheapest endpoint called');
  const { origin } = req.query;

  res.json({
    cheapestFlights: [
      { destination: 'Barcelona', price: 80, airline: 'Test Air' },
      { destination: 'Amsterdam', price: 90, airline: 'Test Air' }
    ],
    origin: origin,
    source: 'fallback',
    cached: false
  });
});

export default flightsRouter;
