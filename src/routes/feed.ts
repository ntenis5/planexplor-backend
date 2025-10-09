// src/routes/feed.ts

import { Router, Request, Response } from 'express';
import { supabase, AdCampaign } from '../services/supabaseClient.js'; 
import { checkCache, saveCache } from '../services/cacheService.js'; 

const feedRouter = Router();

// Krijon një çelës të qëndrueshëm cache-i
const FEED_CACHE_KEY = 'global_active_feed';
// Koha e vlefshmërisë së cache-it (5 minuta)
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
            .eq('status', 'active') 
            .gt('views_purchased', 'views_delivered') 
            .order('id', { ascending: true }) 
            .limit(200); 

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
        }));

        // 3. Ruaj në Cache (Tani funksionon me 3 argumente)
        await saveCache(FEED_CACHE_KEY, feedPosts, CACHE_TTL_SECONDS); 
        console.log(`💾 Feed i ruajtur në Cache për ${CACHE_TTL_SECONDS} sekonda.`);
        
        // 4. Kthe rezultatin
        return res.json(feedPosts.slice(0, limit));

    } catch (error) {
        console.error('Gabim në /api/feed-posts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default feedRouter;
