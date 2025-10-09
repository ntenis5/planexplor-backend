// src/services/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Përdor SERVICE KEY që keni vendosur në Railway (për operacione të fuqishme të Backend-it)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!; 
// Shënim: Kujdes që të keni vendosur edhe SUPABASE_URL.

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  // Përdorimi i service_key shmang nevojën për AutoRefreshToken këtu
  auth: {
    autoRefreshToken: false, 
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Database types
// Ky është një dokumentim i shkëlqyer i skemës së databazës.
export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface SearchCache {
  id: string;
  partner: string;
  data: any;
  last_updated: string;
  expires_at: string;
}

export interface AdCampaign {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  target_categories: string[];
  budget: number;
  views_purchased: number;
  views_delivered: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}
