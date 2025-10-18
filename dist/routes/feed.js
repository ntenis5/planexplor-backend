import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
const feedRouter = Router();
const FEED_CACHE_KEY = 'global_active_feed';
const CACHE_TTL_MINUTES = 5;
feedRouter.get('/feed-posts', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    try {
        const cacheResult = await enhancedCacheService.smartGet(FEED_CACHE_KEY, 'feed_posts_global', 'global');
        if (cacheResult.status === 'hit' && cacheResult.data) {
            console.log('Feed served from Cache.');
            const posts = cacheResult.data;
            return res.json(posts.slice(0, limit));
        }
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
            console.error('Error fetching campaigns:', error);
            return res.status(500).json({ error: 'Database fetch failed.' });
        }
        const feedPosts = campaigns.map((campaign) => ({
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            imageUrl: campaign.image_url,
        }));
        const setResponse = await enhancedCacheService.smartSet(FEED_CACHE_KEY, feedPosts, 'feed_posts_global', 'global');
        console.log(`Feed saved to Cache. Strategy: ${setResponse.strategy?.region || 'default'}, TTL: ${setResponse.strategy?.ttl_minutes || CACHE_TTL_MINUTES} mins.`);
        return res.json(feedPosts.slice(0, limit));
    }
    catch (error) {
        console.error('Error in /api/feed-posts:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
export default feedRouter;
