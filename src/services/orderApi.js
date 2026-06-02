import { supabase } from "../lib/supabase";

const QUEUE_KEY = "basque_offline_orders";

const getQueue = () => JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
const saveQueue = (queue) => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

/**
 * Resolve an active table_session for a table, creating one if needed.
 * Returns the session id, or null if the table id is not a real table.
 */
async function resolveSession(tableId, tableName) {
  // Look for an existing active session
  const { data: existing } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create a new session + mark the table seated
  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({ table_id: tableId, guest_name: tableName || "Guest", party_size: 2, is_active: true })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from("tables")
    .update({ status: "seated", current_session: created.id })
    .eq("id", tableId);

  return created.id;
}

/**
 * Create an order in Supabase.
 * status 'pending_approval' (guest PWA) → needs manager approval
 * status 'new' (staff) → goes straight to the kitchen as 'placed'
 */
export const createOrder = async (orderData) => {
  try {
    const sessionId = await resolveSession(orderData.tableId, orderData.tableName);
    const stage = orderData.status === "pending_approval" ? "pending_approval" : "placed";

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
