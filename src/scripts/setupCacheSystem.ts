// src/scripts/setupCacheSystem.ts
import { supabase } from '../services/supabaseClient.js';

async function setupCacheSystem() {
  console.log('🚀 Setting up Cache System...');
  
  try {
    // Test connection by querying the primary cache table
    const { data, error } = await supabase.from('cache_inteligjent').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful');
    
    // Insert or update default strategies
    const { error: strategyError } = await supabase
      .from('cache_strategies')
      .upsert([
        {
          strategy_name: 'geolocation_adaptive',
          strategy_config: { default_ttl: 360, peak_ttl: 120, offpeak_ttl: 720 },
          is_active: true
        },
        {
          strategy_name: 'affiliate_regional', 
          strategy_config: { eu_ttl: 30, us_ttl: 30, default_ttl: 60 },
          is_active: true
        }
      ], { onConflict: 'strategy_name' });

    if (strategyError) {
      console.error('❌ Cache strategy setup failed:', strategyError.message);
    } else {
      console.log('✅ Cache strategies configured');
    }

    console.log('🎉 Cache system setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupCacheSystem();
