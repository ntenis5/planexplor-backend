import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I RREGULLUAR! Përdor service role key.

if (
  typeof supabaseUrl !== 'string' ||
  !supabaseUrl ||
  typeof supabaseServiceKey !== 'string' ||
  !supabaseServiceKey
) {
  const missingVars = [];
  if (!supabaseUrl || typeof supabaseUrl !== 'string') missingVars.push('SUPABASE_URL');
  if (!supabaseServiceKey || typeof supabaseServiceKey !== 'string') missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

  const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Inicializon klienti i Supabase
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Këto opsione janë të mira për një shërbim backend-i
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

console.log('Supabase Client initialized successfully');

// Për TypeScript, definicioni i interfacedave është i rëndësishëm, por mund ta hiqni nëse përdorni .js
// I have left them in as they came from your provided code, assuming you use TS.

// export interface UserProfile { ... }
// export interface SearchCache { ... }
// export interface AdCampaign { ... }
