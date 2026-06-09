import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase URL or Key. Check your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ghostDatabase() {
  console.log("👻 Ghosting the dummy data to clean the UI...");

  try {
    // 1. Ghost the Reservations (Moves them off the dashboard UI)
    console.log("Hiding reservations...");
    const { error: resError } = await supabase.from('reservations').update({ 
      stage: 'archived', 
      date: '1999-01-01',
      name: 'Archived Demo Data'
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (resError) console.error("⚠️ Failed to update reservations:", resError.message);
    else console.log("✅ Reservations vanished!");

    // 2. Ghost the Floor Plan (Detaches sessions so tables show as Available)
    console.log("Resetting table statuses...");
    const { error: tableError } = await supabase.from('tables').update({ 
      current_session: null, 
      status: 'available' 
    }).neq('id', '');

    if (tableError) console.error("⚠️ Failed to update tables:", tableError.message);
    else console.log("✅ Floor plan reset!");

    // 3. Ghost Active Waitlist & Service Alerts
    console.log("Hiding waitlist and alerts...");
    await supabase.from('waitlist_entries').update({ status: 'declined' }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('service_requests').update({ status: 'completed' }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 4. Ghost Active Orders
    console.log("Completing active orders...");
    await supabase.from('orders').update({ stage: 'served' }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("🎉 UI Cleanup Complete! Refresh your browser at localhost:5174/dashboard.");
  } catch (error) {
    console.error("❌ Catch Error:", error.message);
  }
}

ghostDatabase();