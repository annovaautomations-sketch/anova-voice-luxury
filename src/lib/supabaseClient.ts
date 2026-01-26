// Supabase client wrapper with environment validation
// Note: The actual client is in src/integrations/supabase/client.ts (auto-generated)
// This file provides validation and exports

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function validateSupabaseEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL');
  }
  
  if (!SUPABASE_ANON_KEY) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Re-export the main client
export { supabase } from '@/integrations/supabase/client';
