import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (
  typeof supabaseUrl !== 'string' ||
  !supabaseUrl ||
  typeof supabaseServiceKey !== 'string' ||
  !supabaseServiceKey
) {
  const missingVars: string[] = [];
  if (!supabaseUrl || typeof supabaseUrl !== 'string') missingVars.push('SUPABASE_URL');
  if (!supabaseServiceKey || typeof supabaseServiceKey !== 'string') missingVars.push('SUPABASE_SERVICE_KEY');

  const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

console.log('Supabase Client initialized successfully');

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
