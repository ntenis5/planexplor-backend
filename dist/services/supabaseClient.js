import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (typeof supabaseUrl !== 'string' ||
    !supabaseUrl ||
    typeof supabaseAnonKey !== 'string' ||
    !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl || typeof supabaseUrl !== 'string')
        missingVars.push('SUPABASE_URL');
    if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string')
        missingVars.push('SUPABASE_ANON_KEY');
    const errorMessage = `Missing Supabase environment variables: ${missingVars.join(', ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
console.log('Supabase Client initialized successfully');
