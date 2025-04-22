// frontend/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // React doesn't support PROCESS.env which we can use in backends
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL FRONTEND ERROR: Missing Supabase environment variables.' +
    ' Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.'
  );
}

// Create and export the Supabase client instance for frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Frontend Supabase client initialized.");

// Listener for auth state changes (optional but helpful for debugging)
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Frontend Auth Event: ${event}`, session ? `User: ${session.user?.id}` : 'No session');
});