import express from 'express';
import { supabase } from '../services/supabaseClient';

const router = express.Router();

// Get ad packages
router.get('/packages', async (req, res) => {
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
        id: 'custom',
        name: 'Custom Package',
        price_per_view: 0.50,
        description: 'Custom number of views'
      }
    ];

    res.json({ packages });

  } catch (error) {
    console.error('Ads packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create ad campaign
router.post('/campaigns', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const {
      title,
      image_url,
      target_categories,
      views_count,
      time_slots,
      total_cost
    } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Create ad campaign
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
      return res.status(400).json({ error: campaignError.message });
    }

    res.json({ campaign });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's ad campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      return res.status(400).json({ error: campaignsError.message });
    }

    res.json({ campaigns });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
