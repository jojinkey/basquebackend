import { supabase } from "../lib/supabase";

async function createRequest(data, type) {
  const { data: row, error } = await supabase
    .from("service_requests")
    .insert({
      table_id: data.tableId,
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
