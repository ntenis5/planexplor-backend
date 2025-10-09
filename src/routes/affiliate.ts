// src/routes/affiliate.ts

import { Router, Request, Response } from 'express';
// ✅ Shtuar .js për shkak të konfigurimit NodeNext
import { supabase } from '../services/supabaseClient.js';

// --- Tipi për /feed Query Parameters ---
interface FeedQuery {
  category?: string;
  limit?: string; // Merr si string, konvertohet në numër më poshtë
}

// --- Tipi për /click Body ---
interface ClickBody {
  affiliate_id: string;
  user_id: string | null; // Mund të jetë null nëse përdoruesi nuk është i kyçur
}

const affiliateRouter = Router();

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/affiliate/feed
// Merr të dhënat e Affiliate Feed (H1) me filtra dhe limit
// ----------------------------------------------------------------------------------
affiliateRouter.get('/feed', async (req: Request<{}, {}, {}, FeedQuery>, res: Response) => {
  try {
    // Sigurohuni që limiti të jetë numër, default 20
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 20;
    const { category } = req.query;

    let query = supabase
      .from('affiliate_feed')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Kërkim me 'contains' për kategori
    if (category && category !== 'all') {
      // Ky supozon që kolona 'category' është një array JSONB ose tekst me [] në Supabase
      query = query.contains('category', [category]);
    }

    const { data: feed, error } = await query;

    if (error) {
      console.error('Supabase Affiliate Feed Error:', error.message);
      return res.status(500).json({ error: 'Dështim në marrjen e të dhënave të feed-it.' });
    }

    res.json({ feed });

  } catch (error) {
    console.error('Affiliate feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------------
// ENDPOINT: POST /api/affiliate/click
// Gjurmon klikimin e partnerit
// ----------------------------------------------------------------------------------
affiliateRouter.post('/click', async (req: Request<{}, {}, ClickBody>, res: Response) => {
  try {
    const { affiliate_id, user_id } = req.body;

    if (!affiliate_id) {
        return res.status(400).json({ error: 'ID e partnerit (affiliate_id) është e nevojshme.' });
    }

    // Gjurmo klikimin për analytics
    // Shënim: Përdorimi i service_role key në këtë Back-end lejon shkrimin direkt
    const { error } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id,
        // E vendosim si null nëse nuk ka user_id
        user_id: user_id || null, 
        clicked_at: new Date().toISOString()
      });

    if (error) {
         console.error('Supabase Click Tracking Error:', error.message);
         // Kthe sukses edhe nëse ka gabim, për të mos bllokuar përdoruesin
    }

    // ✅ Kthehet 200/204, pasi gjurmimi është proces i sfondit
    res.status(204).json({ success: true, message: 'Kliki u gjurmua.' });

  } catch (error) {
    console.error('Affiliate click error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default affiliateRouter;
