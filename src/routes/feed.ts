// src/routes/feed.ts
import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabaseClient.js'; 
// Using enhancedCacheService for consistency with the rest of the project
import { enhancedCacheService } from '../services/enhancedCacheService.js'; 

const feedRouter = Router();

// Interface for AdCampaign data structure from Supabase
interface AdCampaign {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  description: string;
  views_purchased: number;
  views_delivered: number;
  status: string;
}

// Interface for the simplified post data sent to the client
interface FeedPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

// Creates a persistent cache key
const FEED_CACHE_KEY = 'global_active_feed';
// Cache Time-To-Live (TTL) in minutes
const CACHE_TTL_MINUTES = 5; 

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/feed-posts?limit=X
// Fetches active posts (ads) from Supabase, utilizing an adaptive cache strategy.
// ----------------------------------------------------------------------------------
feedRouter.get('/feed-posts', async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    
    try {
        // Use the smartGet service that respects the adaptive cache strategy
        const cacheResult = await enhancedCacheService.smartGet(
            FEED_CACHE_KEY, 
            'feed_posts_global', // Endpoint identifier for adaptive strategy
            'global' 
        );

        // 1. Check Cache
        if (cacheResult.status === 'hit' && cacheResult.data) {
            console.log('✅ Feed served from Cache.');
            const posts = cacheResult.data as FeedPost[];
            // Only return the requested limit from the cached array
            return res.json(posts.slice(0, limit));
        }

        // 2. Fetch Active Campaigns from Supabase (Cache Miss)
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
            .gt('views_purchased', 'views_delivered') // Ensure views are available
            .order('id', { ascending: true }) 
            .limit(200); // Limit the raw fetch to prevent huge payloads

        if (error) {
            console.error('Error fetching campaigns:', error);
            return res.status(500).json({ error: 'Database fetch failed.' });
        }
        
        // Prepare simplified data for the Frontend
        const feedPosts: FeedPost[] = campaigns.map((campaign: AdCampaign) => ({
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            imageUrl: campaign.image_url,
        }));

        // 3. Save to Cache using smartSet (which applies the optimal TTL/strategy)
        const setResponse = await enhancedCacheService.smartSet(
            FEED_CACHE_KEY, 
            feedPosts, 
            'feed_posts_global',
            'global'
        );
        
        // ✅ KORRIGJIM: Shto kontroll për null/undefined
        console.log(`💾 Feed saved to Cache. Strategy: ${setResponse.strategy?.strategy || 'default'}, TTL: ${setResponse.strategy?.ttl_minutes || CACHE_TTL_MINUTES} mins.`);
        
        // 4. Return the result
        return res.json(feedPosts.slice(0, limit));

    } catch (error) {
        console.error('Error in /api/feed-posts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default feedRouter;
