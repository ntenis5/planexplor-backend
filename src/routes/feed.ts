// src/routes/feed.ts

import { Router, Request, Response } from 'express';
// ✅ Shtuar .js për shkak të konfigurimit NodeNext
import { supabase, AdCampaign } from '../services/supabaseClient.js'; 
import { checkCache, saveCache } from '../services/cacheService.js'; 

const feedRouter = Router();

// Krijon një çelës të qëndrueshëm cache-i
const FEED_CACHE_KEY = 'global_active_feed';
// Koha e vlefshmërisë së cache-it (p.sh., 5 minuta)
const CACHE_TTL_SECONDS = 300; 

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/feed-posts?limit=X
// Ky merr postimet (reklamat aktive) nga Supabase.
// ----------------------------------------------------------------------------------
feedRouter.get('/feed-posts', async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    
    // 1. Kontrollon Cache-in
    const cachedData = await checkCache(FEED_CACHE_KEY); 
    if (cachedData) {
        // Shërbe nga Cache-i dhe kthen vetëm numrin e kërkuar
        console.log('✅ Feed u shërbye nga Cache.');
        const posts = cachedData as AdCampaign[];
        return res.json(posts.slice(0, limit));
    }

    try {
        // 2. Merr Reklamat nga Supabase
        const { data: campaigns, error } = await supabase
            .from('ad_campaigns')
            .select(`
                id,
                user_id,
                title,
                image_url,
                description,
                views_purchased,
                views_delivered,
                status 
            `)
            .eq('status', 'active') // Merr vetëm fushat aktive
            .gt('views_purchased', 'views_delivered') // Merr vetëm ato me kuotë të mbetur
            .order('id', { ascending: true }) // Renditja e thjeshtë
            .limit(200); // Merr një sasi të mjaftueshme për cache

        if (error) {
            console.error('Gabim në marrjen e fushatave:', error);
            return res.status(500).json({ error: 'Dështim në bazën e të dhënave.' });
        }

        // Përgatit të dhënat e thjeshtëzuara për Frontend-in
        const feedPosts = campaigns.map(campaign => ({
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            imageUrl: campaign.image_url,
            // Shtoni çdo meta-të dhënë që i nevojitet Front-endit (p.sh., linku)
        }));

        // 3. Ruaj në Cache
        await saveCache(FEED_CACHE_KEY, feedPosts, CACHE_TTL_SECONDS);
        console.log(`💾 Feed i ruajtur në Cache për ${CACHE_TTL_SECONDS} sekonda.`);
        
        // 4. Kthe rezultatin (vetëm numrin e kërkuar)
        return res.json(feedPosts.slice(0, limit));

    } catch (error) {
        console.error('Gabim në /api/feed-posts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default feedRouter;
