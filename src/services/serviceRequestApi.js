import { supabase } from "../lib/supabase";

async function createRequest(data, type) {
  // Normalize tableId (e.g. t2 -> T2) for database compatibility
  let normalizedTableId = data.tableId;
  if (typeof data.tableId === "string") {
    const match = data.tableId.match(/^([tT])(\d+)$/);
    if (match) {
      normalizedTableId = "T" + match[2];
    }
  }

  const { data: row, error } = await supabase
    .from("service_requests")
    .insert({
      table_id: normalizedTableId,
      table_name: data.tableName,
      type,
      status: "new",
    })
    .select()
    .single();
  if (error) throw error;
  return row;
}

export const callWaiter = (data) => createRequest(data, "call_waiter");
export const requestBill = (data) => createRequest(data, "bill_request");
