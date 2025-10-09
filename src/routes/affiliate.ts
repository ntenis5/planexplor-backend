import express from 'express';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();

// Get affiliate feed for H1 (main feed)
router.get('/feed', async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;

    let query = supabase
      .from('affiliate_feed')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (category && category !== 'all') {
      query = query.contains('category', [category]);
    }

    const { data: feed, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ feed });

  } catch (error) {
    console.error('Affiliate feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track affiliate click
router.post('/click', async (req, res) => {
  try {
    const { affiliate_id, user_id } = req.body;

    // Track the click for analytics
    await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id,
        user_id,
        clicked_at: new Date().toISOString()
      });

    res.json({ success: true });

  } catch (error) {
    console.error('Affiliate click error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
