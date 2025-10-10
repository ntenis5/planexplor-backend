// src/routes/geolocation.ts - VERSION I PËRDITËSUAR
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { supabase } from '../services/supabaseClient.js'; 

const geolocationRouter = Router();

// FUNKSIONI I RI PËR CACHE
async function getCachedGeolocation(key: string) {
  const { data, error } = await supabase
    .rpc('get_geolocation_cache', { search_query: key });
  
  if (error || !data) return null;
  return data;
}

async function setCachedGeolocation(key: string, data: any, ttl: number = 360) {
  await supabase
    .rpc('cache_geolocation', {
      search_query: key,
      result_data: data,
      ttl_minutes: ttl
    });
}

// 📍 SEARCH ENDPOINT ME CACHE
geolocationRouter.get('/search', async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Kërkohet parametri "query"' });
  }

  const cacheKey = query.toLowerCase().trim();
  
  try {
    // 1. PROVO CACHE-IN E PARË
    const cachedData = await getCachedGeolocation(cacheKey);
    
    if (cachedData) {
      console.log('✅ Geolocation serviced from CACHE:', cacheKey);
      
      // Log performance hit
      await supabase.rpc('log_performance', {
        endpoint_name: 'geolocation_search',
        response_time: 5, // ~5ms për cache hit
        cache_status: 'hit'
      });
      
      return res.json(cachedData);
    }

    // 2. NUK KA CACHE - BEJ API CALL
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
      
      // 3. VENDOS NË CACHE PËR PËRDORIM TË ARDHSHËM
      await setCachedGeolocation(cacheKey, result, 360); // 6 ore
      
      // Log performance miss
      await supabase.rpc('log_performance', {
        endpoint_name: 'geolocation_search',
        response_time: responseTime,
        cache_status: 'miss'
      });
      
      return res.json(result);
    } else {
      return res.status(404).json({ 
        lat: null, 
        lng: null, 
        address: 'Nuk u gjet asnjë lokacion' 
      });
    }

  } catch (error) {
    console.error('Gabim në Geocoding Search:', error);
    
    // Log error performance
    await supabase.rpc('log_performance', {
      endpoint_name: 'geolocation_search',
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Dështim në shërbimin e Geocoding' });
  }
});

// 📍 REVERSE GEOCODE ME CACHE
geolocationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
    return res.status(400).json({ error: 'Kërkohen parametrat "lat" dhe "lng"' });
  }

  const cacheKey = `reverse_${lat}_${lng}`;
  
  try {
    // 1. PROVO CACHE-IN
    const cachedData = await getCachedGeolocation(cacheKey);
    
    if (cachedData) {
      console.log('✅ Reverse Geocode serviced from CACHE:', cacheKey);
      
      await supabase.rpc('log_performance', {
        endpoint_name: 'reverse_geocode',
        response_time: 5,
        cache_status: 'hit'
      });
      
      return res.json(cachedData);
    }

    // 2. API CALL
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

    // 3. CACHE RESULT (24 ORE PËR REVERSE GEOCODE)
    await setCachedGeolocation(cacheKey, result, 1440);
    
    await supabase.rpc('log_performance', {
      endpoint_name: 'reverse_geocode',
      response_time: responseTime,
      cache_status: 'miss'
    });
    
    return res.json(result);

  } catch (error) {
    console.error('Gabim në Reverse Geocoding:', error);
    
    await supabase.rpc('log_performance', {
      endpoint_name: 'reverse_geocode',
      response_time: 0,
      cache_status: 'skip'
    });
    
    return res.status(500).json({ error: 'Dështim në shërbimin e Reverse Geocoding' });
  }
});

export default geolocationRouter;
