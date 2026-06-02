import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdqnadvnjatlavgwjotj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_iX4Ny9H5_fgyXjDWYYulaw_PfKKYty-';

export const supabase = createClient(supabaseUrl, supabaseKey);