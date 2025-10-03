import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
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
