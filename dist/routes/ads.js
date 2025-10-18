import { Router } from 'express';
import { supabase } from '../services/supabaseClient.js';
const adsRouter = Router();
adsRouter.get('/packages', async (req, res) => {
    try {
        const packages = [
            {
                id: 'mini',
                name: 'Mini Package',
                price: 20,
                views_count: 40,
                price_per_view: 0.50,
                description: '40 views for 20€'
            },
            {
                id: 'standard',
                name: 'Standard Package',
                price: 90,
                views_count: 200,
                price_per_view: 0.45,
                description: '200 views for 90€ (5% discount)'
            },
            {
                id: 'custom',
                name: 'Custom Package',
                price_per_view: 0.50,
                description: 'Choose your number of views'
            }
        ];
        res.json({ packages });
    }
    catch (error) {
        console.error('Ads packages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
adsRouter.post('/campaigns', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { title, image_url, target_categories, views_count, time_slots, total_cost } = req.body;
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided.' });
        }
        if (!title || !image_url || !views_count || !total_cost) {
            return res.status(400).json({ error: 'Required fields are missing.' });
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        const { data: campaign, error: campaignError } = await supabase
            .from('ad_campaigns')
            .insert({
            user_id: user.id,
            title,
            image_url,
            target_categories,
            views_purchased: views_count,
            views_delivered: 0,
            total_cost,
            time_slots,
            status: 'pending_payment'
        })
            .select()
            .single();
        if (campaignError) {
            console.error('Supabase Campaign Error:', campaignError.message);
            return res.status(400).json({ error: 'Failed to create campaign.' });
        }
        res.status(201).json({
            campaign,
            message: 'Campaign created successfully. Payment required.'
        });
    }
    catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
adsRouter.get('/campaigns', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided.' });
        }
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        const { data: campaigns, error: campaignsError } = await supabase
            .from('ad_campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (campaignsError) {
            console.error('Supabase Get Campaigns Error:', campaignsError.message);
            return res.status(500).json({ error: 'Failed to fetch campaigns.' });
        }
        res.json({ campaigns });
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default adsRouter;
