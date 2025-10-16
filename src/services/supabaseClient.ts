import { createClient } from '@supabase/supabase-js';

// Përdor ANON_KEY për klientin e browser-it, jo SERVICE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // 👈 Ndrysho këtu

if (
  typeof supabaseUrl !== 'string' ||
  !supabaseUrl ||
  typeof supabaseAnonKey !== 'string' ||
  !supabaseAnonKey
) {
  const missingVars: string[] = [];
  if (!supabaseUrl || typeof supabaseUrl !== 'string') missingVars.push('SUPABASE_URL');
  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') missingVars.push('SUPABASE_ANON_KEY'); // 👈 Ndrysho këtu

  const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, { // 👈 Dhe këtu
  auth: {
    autoRefreshToken: true,    // 👈 Duhet të jetë true
    persistSession: true,      // 👈 Duhet të jetë true  
    detectSessionInUrl: true,  // 👈 Duhet të jetë true
  },
});

console.log('Supabase Client initialized successfully');

// ... rest i interfaces mbetet i njëjtë
