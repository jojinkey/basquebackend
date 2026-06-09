import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api/orders`;

const QUEUE_KEY = "basque_offline_orders";

<<<<<<< Updated upstream
const getQueue = () => {
  return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
};

const saveQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const createOrder = async (orderData) => {
  try {
    const response = await axios.post(API_URL, orderData);

    return response.data;
  } catch (error) {
=======
const getQueue = () => JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
const saveQueue = (queue) =>
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

async function resolveSession(tableId, tableName) {
  const { data: existing } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({
      table_id: tableId,
      guest_name: tableName || "Guest",
      covers: 2,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("tables")
    .update({
      status: "seated",
      current_session: created.id,
    })
    .eq("id", tableId);

  return created.id;
}

export const createOrder = async (orderData) => {
  try {
    const sessionId = await resolveSession(
      orderData.tableId,
      orderData.tableName
    );

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        session_id: sessionId,
        status: "pending_approval",
        subtotal: orderData.total,
        placed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const names = (orderData.items || []).map((i) => i.name);

    if (names.length) {
      const { data: menuRows, error: menuError } = await supabase
        .from("menu_items")
        .select("id, name")
        .in("name", names);

      if (menuError) throw menuError;

      const idByName = {};
      (menuRows || []).forEach((m) => {
        idByName[m.name] = m.id;
      });

      const lineItems = (orderData.items || [])
        .filter((i) => idByName[i.name])
        .map((i) => ({
          order_id: order.id,
          menu_item_id: idByName[i.name],
          quantity: i.qty,
          unit_price: i.price,
        }));

      if (lineItems.length) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(lineItems);

        if (itemsError) throw itemsError;
      }
    }

    return order;
  } catch (error) {
    console.error("Order create failed:", error);

>>>>>>> Stashed changes
    const queue = getQueue();

    queue.push({
      ...orderData,
      queuedAt: new Date().toISOString(),
    });

    saveQueue(queue);

    return {
      offline: true,
<<<<<<< Updated upstream
      message:
        "Order saved offline. It will sync automatically.",
=======
      message: "Order saved offline. It will sync automatically.",
>>>>>>> Stashed changes
    };
  }
};

export const syncOfflineOrders = async () => {
  const queue = getQueue();
<<<<<<< Updated upstream

  if (queue.length === 0) return;

  const remainingOrders = [];
=======
  if (queue.length === 0) return 0;

  const remaining = [];
>>>>>>> Stashed changes

  for (const order of queue) {
    try {
      await axios.post(API_URL, order);
    } catch (error) {
      remainingOrders.push(order);
    }
  }

<<<<<<< Updated upstream
  saveQueue(remainingOrders);

  return remainingOrders.length;
};

export const getOfflineOrders = () => {
  return getQueue();
};
=======
  saveQueue(remaining);
  return remaining.length;
};

export const getOfflineOrders = () => getQueue();
>>>>>>> Stashed changes
