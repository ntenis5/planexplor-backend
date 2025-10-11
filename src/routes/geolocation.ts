// src/routes/geolocation.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { supabase } from '../services/supabaseClient.js'; 
import { enhancedCacheService } from '../services/enhancedCacheService.js'; // Import the enhanced service

const geolocationRouter = Router();

// Define the unique endpoint identifier for adaptive caching logic
const ENDPOINT_GEO_SEARCH = 'geolocation_search';
const ENDPOINT_GEO_REVERSE = 'geolocation_reverse';

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /search
// Geocoding search with adaptive caching and performance logging.
// ----------------------------------------------------------------------------------
geolocationRouter.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'The "query" parameter is required' });
  }

  const cacheKey = `geo_search:${query.toLowerCase().trim()}`;
  
  try {
    const userRegion = req.headers['x-user-region'] as string || 'eu';

    // 1. ATTEMPT SMART CACHE HIT
    const cacheResult = await enhancedCacheService.smartGet(
      cacheKey,
      ENDPOINT_GEO_SEARCH,
      userRegion
    );
    
    if (cacheResult.status === 'hit' && cacheResult.data) {
      console.log('✅ Geolocation serviced from CACHE:', cacheKey);
      
      // Log performance hit (using a fixed minimal time for cache access)
      await supabase.rpc('log_performance', {
        endpoint_name: ENDPOINT_GEO_SEARCH,
        response_time: 5, 
        cache_status: 'hit'
      });
      
      return res.json(cacheResult.data);
    }

    // 2. CACHE MISS - EXECUTE API CALL
    console.log('🔄 Fetching fresh geolocation data:', cacheKey);
    
    const startTime = Date.now();
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search', 
      {
        params: { 
          q: query, 
          format: 'json', 
          limit: 1,
          addressdetails: 1
        },
        timeout: 10000
      }
    );
    const responseTime = Date.now() - startTime;

    const results = response.data;

    if (results && results.length > 0) {
      const result = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        address: results[0].display_name,
        boundingbox: results[0].boundingbox
      };
      
      // 3. STORE IN CACHE using smartSet (TTL is managed by adaptive strategy)
      await enhancedCacheService.smartSet(
        cacheKey,
        result,
        ENDPOINT_GEO_SEARCH,
        userRegion
      ); 
      
      // Log performance miss
      await supabase.rpc('log_performance', {
        endpoint_name: ENDPOINT_GEO_SEARCH,
        response_time: responseTime,
        cache_status: 'miss'
      });
      
      return res.json(result);
    } else {
      return res.status(404).json({ 
        lat: null, 
        lng: null, 
        address: 'No location found' 
      });
    }

  } catch (error) {
    console.error('Error in Geocoding Search:', error);
    
    // Log error performance
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_SEARCH,
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Geocoding service failed' });
  }
});

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /reverse-geocode
// Reverse Geocoding with adaptive caching and performance logging.
// ----------------------------------------------------------------------------------
geolocationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'The "lat" and "lng" parameters are required' });
  }

  const cacheKey = `geo_reverse:${lat}_${lng}`;
  
  try {
    const userRegion = req.headers['x-user-region'] as string || 'eu';

    // 1. ATTEMPT SMART CACHE HIT
    const cacheResult = await enhancedCacheService.smartGet(
        cacheKey, 
        ENDPOINT_GEO_REVERSE, 
        userRegion
    );
    
    if (cacheResult.status === 'hit' && cacheResult.data) {
      console.log('✅ Reverse Geocode serviced from CACHE:', cacheKey);
      
      await supabase.rpc('log_performance', {
        endpoint_name: ENDPOINT_GEO_REVERSE,
        response_time: 5,
        cache_status: 'hit'
      });
      
      return res.json(cacheResult.data);
    }

    // 2. CACHE MISS - API CALL
    console.log('🔄 Fetching fresh reverse geocode:', cacheKey);
    const startTime = Date.now();
    
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/reverse',
      {
        params: { 
          format: 'json', 
          lat: lat, 
          lon: lng, 
          zoom: 18, 
          addressdetails: 1 
        },
        timeout: 10000
      }
    );
    
    const responseTime = Date.now() - startTime;
    const data = response.data;
    
    const result = { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng), 
      address: data.display_name || 'Selected Location',
      details: data.address
    };

    // 3. CACHE RESULT (TTL is managed by adaptive strategy)
    await enhancedCacheService.smartSet(
        cacheKey,
        result,
        ENDPOINT_GEO_REVERSE,
        userRegion
    );
    
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_REVERSE,
      response_time: responseTime,
      cache_status: 'miss'
    });
    
    return res.json(result);

  } catch (error) {
    console.error('Error in Reverse Geocoding:', error);
    
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_REVERSE,
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Reverse Geocoding service failed' });
  }
});

export default geolocationRouter;
