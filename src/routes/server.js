// server.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // Për thirrjet API në backend

const app = express();
const PORT = process.env.PORT || 3001;

// *************************************************************
// ✅ SEKRETE DHE KONFIGURIME (Vendosen si Environment Variables në Railway)
// *************************************************************
// Nqs kaloni ne Mapbox/Google, vendosni çelësin këtu (p.sh., process.env.MAPBOX_SECRET_KEY)
const NOMINATIM_REVERSE_URL = process.env.NOMINATIM_REVERSE_URL || 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_SEARCH_URL = process.env.NOMINATIM_SEARCH_URL || 'https://nominatim.openstreetmap.org/search';
const FRONTEND_URL = process.env.FRONTEND_URL || '*'; // Vendosni URL-në e Vercel-it
// *************************************************************


// Konfigurimet bazë
app.use(cors({
    origin: FRONTEND_URL, 
    methods: ['GET'],
}));
app.use(express.json());

// ----------------------------------------------------------------------------------
// ⚠️ SIMULIMI I CACHING ME SUPABASE
// Zëvendësoni këto funksione me kodin tuaj të vërtetë të Supabase (p.sh., me librarinë 'supabase-js')
// ----------------------------------------------------------------------------------
const checkCache = async (key) => {
    // Shembull: Këtu do të bëni thirrjen në Supabase
    // const { data } = await supabase.from('location_cache').select('data').eq('key', key).single();
    return null; // Simulon MISS
};

const saveCache = async (key, data) => {
    // Shembull: Këtu do të bëni INSERT në Supabase
    // await supabase.from('location_cache').upsert({ key: key, data: data, created_at: new Date() });
    console.log(`[CACHE SIMULIM] Ruajtur rezultati për çelësin: ${key}`);
};


// ----------------------------------------------------------------------------------
// 1. ENDPOINT: /api/geolocation/search (Geocoding: Adresa -> Koordinatat)
// ----------------------------------------------------------------------------------
app.get('/api/geolocation/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Kërkohet parametri "query"' });

    const cacheKey = `search:${query.toLowerCase()}`;
    const cachedData = await checkCache(cacheKey);

    if (cachedData) {
        return res.json(cachedData); // HIT: Kthehet direkt nga Supabase
    }

    try {
        // Thirrja e vërtetë e API-së së fshehur
        const response = await fetch(
            `${NOMINATIM_SEARCH_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        
        const results = await response.json();

        if (results && results.length > 0) {
            const result = {
                lat: results[0].lat, // Këto duhen të jenë si string
                lng: results[0].lon, // Këto duhen të jenë si string
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
// 2. ENDPOINT: /api/geolocation/reverse-geocode (Reverse Geocoding: Koordinatat -> Adresa)
// ----------------------------------------------------------------------------------
app.get('/api/geolocation/reverse-geocode', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'Kërkohen parametrat "lat" dhe "lng"' });

    const cacheKey = `reverse:${lat},${lng}`;
    const cachedData = await checkCache(cacheKey);

    if (cachedData) {
        return res.json(cachedData); // HIT: Kthehet direkt nga Supabase
    }

    try {
        // Thirrja e vërtetë e API-së së fshehur
        const response = await fetch(
            `${NOMINATIM_REVERSE_URL}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        
        const data = await response.json();
        
        const address = data.display_name || 'Selected Location';
        const result = { lat: lat, lng: lng, address };

        await saveCache(cacheKey, result);
        return res.json(result);

    } catch (error) {
        console.error('Gabim në Reverse Geocoding:', error);
        return res.status(500).json({ error: 'Dështim në shërbimin e Reverse Geocoding' });
    }
});


// Start serveri
app.listen(PORT, () => {
    console.log(`Serveri i Railway po dëgjon në portën ${PORT}`);
});
