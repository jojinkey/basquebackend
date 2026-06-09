import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase URL or Key. Check your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllReservations() {
  console.log("🗑️  Deleting all reservation data...");

  try {
    const { error, count } = await supabase
      .from('reservations')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error("❌ Failed to delete reservations:", error.message);
    } else {
      console.log(`✅ Done! ${count ?? 'All'} reservations deleted.`);
      console.log("🔄 Refresh your browser — pipeline should be empty now.");
    }
  } catch (err) {
    console.error("❌ Catch Error:", err.message);
  }
}

deleteAllReservations();
