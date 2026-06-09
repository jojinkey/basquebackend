import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanAll() {
  console.log("🗑️  Cleaning all dummy data...\n");

  const tables = ['orders', 'reservations'];

  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) console.error(`❌ ${table}:`, error.message);
    else console.log(`✅ ${table}: ${count ?? 'all'} rows deleted`);
  }

  console.log("\n🎉 Done! Refresh your browser.");
}

cleanAll();
