import { Router, Request, Response } from 'express';
import axios from 'axios';
import { supabase } from '../services/supabaseClient.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';

const geolocationRouter = Router();

// Endpoint Names for logging in Supabase
const ENDPOINT_GEO_SEARCH = 'geolocation_search';
const ENDPOINT_GEO_REVERSE = 'geolocation_reverse';

// Environment Variables
const NOMINATIM_REVERSE_URL = process.env.NOMINATIM_REVERSE_URL; 
const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL;

const MAPBOX_REVERSE_URL = process.env.MAPBOX_API_BASE_URL;
const MAPBOX_SECRET_KEY = process.env.MAPBOX_SECRET_KEY;

// Forward Geocoding (Address to Lat/Lng)
geolocationRouter.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'The "query" parameter is required' });
  }

  if (!NOMINATIM_SEARCH_URL) {
      // In production, log this error instead of exposing env var names
      return res.status(500).json({ error: 'Search URL is not configured.' });
  }

  const cacheKey = `geo_search:${query.toLowerCase().trim()}`;
  
  try {
    const userRegion = req.headers['x-user-region'] as string || 'eu';

    // Cache Check
    const cacheResult = await enhancedCacheService.smartGet(
      cacheKey,
      ENDPOINT_GEO_SEARCH,
      userRegion
    );
    
    if (cacheResult.status === 'hit' && cacheResult.data) {
      await supabase.rpc('log_performance', {
        endpoint_name: ENDPOINT_GEO_SEARCH,
        response_time: 5, // Simulated low time for cache hit
        cache_status: 'hit'
      });
      
      return res.json(cacheResult.data);
    }

    // External API Call (Nominatim/OSM)
    const startTime = Date.now();
    const response = await axios.get(
      NOMINATIM_SEARCH_URL, 
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

    const results = response.data as Array<any>; 

    if (results && results.length > 0) {
      const result = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
        address: results[0].display_name,
        boundingbox: results[0].boundingbox
      };
      
      // Set Cache
      await enhancedCacheService.smartSet(
        cacheKey,
        result,
        ENDPOINT_GEO_SEARCH,
        userRegion
      ); 
      
      // Log Performance
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
    // Log Error/Skip
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_SEARCH,
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Geocoding service failed' });
  }
});


// Reverse Geocoding (Lat/Lng to Address)
geolocationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lng, provider } = req.query; 

  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'The "lat" and "lng" parameters are required' });
  }

  const providerName = provider === 'mapbox' ? 'mapbox' : 'osm';
  const cacheKey = `geo_reverse:${providerName}:${lat}_${lng}`;

  try {
    const userRegion = req.headers['x-user-region'] as string || 'eu';

    // Cache Check
    const cacheResult = await enhancedCacheService.smartGet(
        cacheKey, 
        ENDPOINT_GEO_REVERSE, 
        userRegion
    );
    
    if (cacheResult.status === 'hit' && cacheResult.data) {
      await supabase.rpc('log_performance', {
        endpoint_name: ENDPOINT_GEO_REVERSE,
        response_time: 5,
        cache_status: 'hit'
      });
      
      return res.json(cacheResult.data);
    }

    let apiUrl: string | undefined;
    let params: any;

    // Determine Provider API Configuration
    if (providerName === 'mapbox') {
      if (!MAPBOX_REVERSE_URL || !MAPBOX_SECRET_KEY) {
          throw new Error("Mapbox API keys are not configured.");
      }
      apiUrl = `${MAPBOX_REVERSE_URL}${lng},${lat}.json`;
      params = {
        access_token: MAPBOX_SECRET_KEY,
      };
    } else { // OSM (Default)
      if (!NOMINATIM_REVERSE_URL) {
          return res.status(500).json({ error: 'NOMINATIM_REVERSE_URL is not configured.' });
      }
      apiUrl = NOMINATIM_REVERSE_URL; 
      params = {
        format: 'json', 
        lat: lat, 
        lon: lng, 
        zoom: 18, 
        addressdetails: 1 
      };
    }

    // External API Call
    const startTime = Date.now();
    const response = await axios.get(apiUrl, { params: params, timeout: 10000 });
    const responseTime = Date.now() - startTime;
    const data = response.data;
    
    let addressName: string = 'Selected Location';
    
    if (providerName === 'mapbox') {
        addressName = data.features?.[0]?.place_name || addressName;
    } else { 
        addressName = data.display_name || addressName;
    }

    const result = { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng), 
      address: addressName, 
      details: data.address || null
    };

    // Set Cache
    await enhancedCacheService.smartSet(
        cacheKey,
        result,
        ENDPOINT_GEO_REVERSE,
        userRegion
    );
    
    // Log Performance
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_REVERSE,
      response_time: responseTime,
      cache_status: 'miss'
    });
    
    return res.json(result);

  } catch (error) {
    // Log Error/Skip
    await supabase.rpc('log_performance', {
      endpoint_name: ENDPOINT_GEO_REVERSE,
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Reverse Geocoding service failed' });
  }
});

export default geolocationRouter;
  
