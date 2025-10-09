// src/routes/ads.ts

import { Router, Request, Response } from 'express';
// ✅ Importi me .js
import { supabase } from '../services/supabaseClient.js';

// --- Tipi për trupin e kërkesës (Body Type) ---
interface CreateCampaignBody {
  title: string;
  image_url: string;
  target_categories: string[];
  views_count: number;
  time_slots: string[]; // Supozojmë një array string-ash (p.sh., orët/ditët)
  total_cost: number;
}

// Përdorim Router-in e saktë
const adsRouter = Router();

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/ads/packages
// Merr paketat e reklamave
// ----------------------------------------------------------------------------------
adsRouter.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = [
      {
        id: 'mini',
        name: 'Mini Package',
        price: 20, // 20€
        views_count: 40,
        price_per_view: 0.50,
        description: '40 views for 20€'
      },
      {
        id: 'standard',
        name: 'Standard Package',
        price: 90, // 90€
        views_count: 200, // 0.45€ per view
        price_per_view: 0.45,
        description: '200 views for 90€ (5% discount)'
      },
      {
        id: 'custom',
        name: 'Custom Package',
        price_per_view: 0.50,
        description: 'Zgjidhni numrin tuaj të shikimeve'
      }
    ];

    res.json({ packages });

  } catch (error) {
    console.error('Ads packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------------
// ENDPOINT: POST /api/ads/campaigns
// Krijon fushatën e reklamave (me status 'pending_payment')
// ----------------------------------------------------------------------------------
adsRouter.post('/campaigns', async (req: Request<{}, {}, CreateCampaignBody>, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // De-strukturimi me saktësi nga trupi i tipizuar
    const {
      title,
      image_url,
      target_categories,
      views_count,
      time_slots,
      total_cost
    } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Nuk u ofrua token-i i autentifikimit.' });
    }
    if (!title || !image_url || !views_count || !total_cost) {
         return res.status(400).json({ error: 'Fusha thelbësore mungon.' });
    }

    // 1. Verifikimi i Përdoruesit
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token-i i pavlefshëm ose i skaduar.' });
    }

    // 2. Krijimi i Fushatës me statusin e Pagesës në Pritje
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
        status: 'pending_payment' // ✅ Statusi fillestar korrekt
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Supabase Campaign Error:', campaignError.message);
      return res.status(400).json({ error: 'Dështim në krijimin e fushatës.' });
    }

    // 3. Kthe Fushatën e Krijuar
    res.status(201).json({ 
        campaign,
        message: 'Fushata u krijua me sukses. Tani kërkohet pagesa.'
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/ads/campaigns
// Merr fushatat e reklamave të përdoruesit
// ----------------------------------------------------------------------------------
adsRouter.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Nuk u ofrua token-i i autentifikimit.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token-i i pavlefshëm.' });
    }

    // Merr fushatat e përdoruesit
    const { data: campaigns, error: campaignsError } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('Supabase Get Campaigns Error:', campaignsError.message);
      return res.status(500).json({ error: 'Dështim në marrjen e fushatave.' });
    }

    res.json({ campaigns });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default adsRouter;
