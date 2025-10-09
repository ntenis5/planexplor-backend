// src/routes/geolocation.ts

import { Router, Request, Response } from 'express';
import axios from 'axios';
// ✅ U RREGULLUA: Shtuar .js
import { checkCache, saveCache } from '../services/cacheService.js'; 

const geolocationRouter = Router();

// Sekrete (duhen vendosur në Railway Environment Variables)
const NOMINATIM_REVERSE_URL = process.env.NOMINATIM_REVERSE_URL || 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';

// ----------------------------------------------------------------------------------
// 1. ENDPOINT: GET /api/geolocation/search (Geocoding: Adresa -> Koordinatat)
// ----------------------------------------------------------------------------------
geolocationRouter.get('/search', async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Kërkohet parametri "query"' });
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cachedData = await checkCache(cacheKey); 

    if (cachedData) {
        return res.json(cachedData); 
    }

    try {
        const response = await axios.get(NOMINATIM_SEARCH_URL, {
            params: { q: query, format: 'json', limit: 1 }
        });
        
        const results = response.data;

        if (results && results.length > 0) {
            const result = {
                lat: results[0].lat, 
                lng: results[0].lon, 
                address: results[0].display_name
            };
            
            await saveCache(cacheKey, result); 
            return res.json(result);
        } else {
            return res.status(404).json({ lat: null, lng: null, address: 'Nuk u gjet asnjë lokacion' });
        }

    } catch (error) {
        console.error('Gabim në Geocoding Search:', error);
        return res.status(500).json({ error: 'Dështim në shërbimin e Geocoding' });
    }
});


// ----------------------------------------------------------------------------------
// 2. ENDPOINT: GET /api/geolocation/reverse-geocode (Reverse Geocoding: Koordinatat -> Adresa)
// ----------------------------------------------------------------------------------
geolocationRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
    const { lat, lng } = req.query;

    if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
        return res.status(400).json({ error: 'Kërkohen parametrat "lat" dhe "lng"' });
    }

    const cacheKey = `reverse:${lat},${lng}`;
    const cachedData = await checkCache(cacheKey); 

    if (cachedData) {
        return res.json(cachedData);
    }

    try {
        const response = await axios.get(NOMINATIM_REVERSE_URL, {
            params: { format: 'json', lat: lat, lon: lng, zoom: 18, addressdetails: 1 }
        });
        
        const data = response.data;
        
        const address = data.display_name || 'Selected Location';
        const result = { lat: lat, lng: lng, address };

        await saveCache(cacheKey, result); 
        return res.json(result);

    } catch (error) {
        console.error('Gabim në Reverse Geocoding:', error);
        return res.status(500).json({ error: 'Dështim në shërbimin e Reverse Geocoding' });
    }
});

export default geolocationRouter;
