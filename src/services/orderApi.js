import { supabase } from "../lib/supabase";

const QUEUE_KEY = "basque_offline_orders";

const getQueue = () => JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
const saveQueue = (queue) => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

/**
 * Resolve an active table_session for a table, creating one if needed.
 * Returns the session id, or null if the table id is not a real table.
 */
async function resolveSession(tableId, tableName, isPending = false) {
  // Normalize tableId (e.g. t2 -> T2) for database compatibility
  let normalizedTableId = tableId;
  if (typeof tableId === "string") {
    const match = tableId.match(/^([tT])(\d+)$/);
    if (match) {
      normalizedTableId = "T" + match[2];
    }
  }

  // Fetch the table to see its current status and session
  const { data: table } = await supabase
    .from("tables")
    .select("id, status, current_session")
    .eq("id", normalizedTableId)
    .maybeSingle();

  // If table doesn't exist, fallback to prevent foreign key errors (e.g. for digital-menu)
  let finalTableId = normalizedTableId;
  let currentSessionId = table?.current_session;

  if (!table) {
    const { data: firstTable } = await supabase
      .from("tables")
      .select("id, current_session")
      .eq("is_active", true)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    
    finalTableId = firstTable?.id || "T1";
    currentSessionId = firstTable?.current_session;
  }

  // Check if there is already an open session (active or pending approval) for this table
  const { data: existingSession } = await supabase
    .from("table_sessions")
    .select("id, is_active")
    .eq("table_id", finalTableId)
    .is("left_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    return existingSession.id;
  }

  // If we reach here, it means there is no open session currently linked to the table.
  // To prevent orphans, let's close any other unclosed sessions for this table
  await supabase
    .from("table_sessions")
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq("table_id", finalTableId)
    .is("left_at", null);

  // Create a new session + mark the table seated if not pending manager approval
  const isActive = !isPending;
  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({ table_id: finalTableId, guest_name: tableName || "Guest", party_size: 2, is_active: isActive })
    .select()
    .single();
  if (error) throw error;

  if (isActive) {
    await supabase
      .from("tables")
      .update({ status: "seated", current_session: created.id })
      .eq("id", finalTableId);
  }

  return created.id;
}

/**
 * Create an order in Supabase.
 * status 'pending_approval' (guest PWA) → needs manager approval
 * status 'new' (staff) → goes straight to the kitchen as 'placed'
 */
export const createOrder = async (orderData) => {
  try {
    const isPending = orderData.status === "pending_approval";
    const sessionId = await resolveSession(orderData.tableId, orderData.tableName, isPending);
    const stage = isPending ? "pending_approval" : "placed";

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        session_id: sessionId,
        stage,
        subtotal: orderData.total,
        placed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // Map cart item names → menu_item ids
    const names = (orderData.items || []).map((i) => i.name);
    if (names.length) {
      const { data: menuRows } = await supabase
        .from("menu_items")
        .select("id, name")
        .in("name", names);
      const idByName = {};
      (menuRows || []).forEach((m) => { idByName[m.name] = m.id; });

      const lineItems = (orderData.items || [])
        .filter((i) => idByName[i.name])
        .map((i) => ({
          order_id: order.id,
          menu_item_id: idByName[i.name],
          quantity: i.qty,
          unit_price: i.price,
        }));
      if (lineItems.length) await supabase.from("order_items").insert(lineItems);
    }

    return order;
  } catch (error) {
    console.error("Supabase order creation error:", error);
    // Offline fallback — queue for later sync
    const queue = getQueue();
    queue.push({ ...orderData, queuedAt: new Date().toISOString() });
    saveQueue(queue);
    return { offline: true, message: "Order saved offline. It will sync automatically." };
  }
};

export const syncOfflineOrders = async () => {
  const queue = getQueue();
  if (queue.length === 0) return 0;
  const remaining = [];
  for (const order of queue) {
    const result = await createOrder(order);
    if (result?.offline) remaining.push(order);
  }
  saveQueue(remaining);
  return remaining.length;
};

export const getOfflineOrders = () => getQueue();
