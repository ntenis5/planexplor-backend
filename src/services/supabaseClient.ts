// src/services/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
// Kujdes: Heqim 'dotenv' dhe 'dotenv.config()' sepse Railway i ngarkon 
// variablat e mjedisit direkt në process.env.

// Përdor SERVICE KEY (të vendosur në Railway)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 

// 🚨 Kontrolli i qartë për Variablat Mjedisore
if (!supabaseUrl || !supabaseServiceKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('SUPABASE_URL');
  if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_KEY');
  
  const errorMessage = `❌ Gabim i Konfigurimit (Fatal): Variablat e Supabase mungojnë: ${missingVars.join(', ')}. 
  Sigurohuni që ato janë vendosur si Variabla Mjedisi në dashboardin e Railway.`;
  
  console.error(errorMessage);
  // Nxjerrim gabim fatal në mënyrë që serveri të mos fillojë nëse çelësat mungojnë
  throw new Error(errorMessage); 
}

// ----------------------------------------------------------------------------------
// Inicializimi i Klientit
// ----------------------------------------------------------------------------------
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  // Përdorimi i Service Key e bën serverin stateless (pa menaxhim sesioni)
  auth: {
    autoRefreshToken: false, 
    persistSession: false,
    detectSessionInUrl: false
  }
});

console.log('🔗 Supabase Client u inicializua me sukses duke përdorur Service Key.');


// Database types (Mbajmë definicionet e tipeve të shkëlqyera)
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
