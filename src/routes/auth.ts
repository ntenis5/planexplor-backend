// src/routes/auth.ts

import { Router, Request, Response } from 'express';
// ✅ Shtuar .js për shkak të konfigurimit NodeNext
import { supabase } from '../services/supabaseClient.js';

// --- Tipi për trupin e kërkesës PUT /profile ---
interface UpdateProfileBody {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

const authRouter = Router();

// ----------------------------------------------------------------------------------
// ENDPOINT: GET /api/auth/profile
// Merr profilin e përdoruesit të autentifikuar
// ----------------------------------------------------------------------------------
authRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Nuk u ofrua token-i i autentifikimit.' });
    }

    // 1. Verifiko token-in me Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Gabim verifikimi token-i:', error);
      return res.status(401).json({ error: 'Token-i i pavlefshëm.' });
    }

    // 2. Merr profilin e përdoruesit
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Nëse profili mungon, mund të duhet të krijohet në hyrje/regjistrim
      console.error('Gabim në marrjen e profilit:', profileError.message);
      return res.status(404).json({ error: 'Profili i përdoruesit nuk u gjet.' });
    }

    // 3. Kthe të dhënat e kombinuara
    res.json({
      user: {
        id: user.id,
        email: user.email,
        // Përfshin të gjitha fushat e profilit (username, full_name, etj.)
        ...profile 
      }
    });

  } catch (error) {
    console.error('Auth error (GET profile):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------------
// ENDPOINT: PUT /api/auth/profile
// Përditëson profilin e përdoruesit të autentifikuar
// ----------------------------------------------------------------------------------
authRouter.put('/profile', async (req: Request<{}, {}, UpdateProfileBody>, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    // ✅ Përdor trupin e tipizuar të kërkesës
    const { username, full_name, avatar_url } = req.body; 

    if (!token) {
      return res.status(401).json({ error: 'Nuk u ofrua token-i i autentifikimit.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token-i i pavlefshëm.' });
    }

    // 1. Krijon objektin e përditësimit vetëm me fusha që nuk janë 'undefined'
    const updatePayload: Partial<UpdateProfileBody & { updated_at: string }> = {
        updated_at: new Date().toISOString()
    };
    
    if (username !== undefined) updatePayload.username = username;
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;


    // 2. Përditëson profilin
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload) // Përdor payload të tipizuar
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Gabim përditësimi profili Supabase:', updateError.message);
      return res.status(400).json({ error: 'Dështim në përditësimin e profilit.' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default authRouter;
