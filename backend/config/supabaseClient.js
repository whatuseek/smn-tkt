// backend/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Public Anon Key for frontend/standard auth
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'CRITICAL ERROR: Missing Supabase URL or Anon Key.' +
    ' Ensure SUPABASE_URL and SUPABASE_ANON_KEY are in the .env file.'
  );
  process.exit(1);
}

// Default client (uses Anon Key - RLS policies will apply)
const supabase = createClient(supabaseUrl, supabaseKey);
console.log("Default Supabase client (anon key) initialized.");

// Admin client (uses Service Role Key - Bypasses RLS)
// Still useful for operations like inserting into `public.users` if RLS restricts the default client
let supabaseAdmin = null;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log("Supabase Admin client (service_role) INITIALIZED.");
} else {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found in .env. Supabase Admin client NOT initialized.");
    console.warn("Operations requiring RLS bypass (like user uploads if restricted) might fail.");
}

export default supabase; // Export the default client
export { supabaseAdmin }; // Export the admin client (might be null)