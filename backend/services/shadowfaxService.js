let cachedToken = null;
let tokenExpiresAt = null;

// ─── Token Management (Private) ─────────────────────────────────────────────
async function getToken() {
  // Use 60-second buffer to ensure token doesn't expire mid-flight
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const response = await fetch(`${process.env.SHADOWFAX_BASE_URL}/api/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHADOWFAX_CLIENT_ID,
      client_secret: process.env.SHADOWFAX_CLIENT_SECRET
    })
  });

  const data = await response.json();

  if (!response.ok || data.status !== 'success') {
    throw new Error(`Shadowfax auth failed: ${data.message || response.statusText}`);
  }

  cachedToken = data.data.token;
  // Convert expires_in (seconds) to milliseconds
  tokenExpiresAt = Date.now() + (data.data.expires_in * 1000);
  
  return cachedToken;
}

// ─── Serviceability Check ───────────────────────────────────────────────────
export async function checkServiceability(deliveryPincode) {
  try {
    const token = await getToken();
    
    const params = new URLSearchParams({
      pickup_pincode: process.env.RESTAURANT_PINCODE,
      delivery_pincode: deliveryPincode,
      order_type: "PREPAID"
    });

    const response = await fetch(`${process.env.SHADOWFAX_BASE_URL}/api/v1/serviceability?${params.toString()}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success && data.data && data.data.is_serviceable) {
      return { 
        serviceable: true, 
        estimatedDays: data.data.estimated_delivery_days || 1 
      };
    }

    return { serviceable: false, reason: "Location is not serviceable by Shadowfax." };
  } catch (error) {
    return { serviceable: false, reason: error.message };
  }
}

// ─── Create Shipment ────────────────────────────────────────────────────────
export async function createShipment(deliveryOrder) {
  try {
    const token = await getToken();

    const payload = {
      client_order_number: deliveryOrder.clientOrderNumber,
      order_type: "PREPAID",
      declared_value: deliveryOrder.total,
      cod_amount: 0.00,
      pickup_details: {
        pickup_location_id: "BASQUE-MAIN",
        contact_name: process.env.RESTAURANT_NAME,
        contact_phone: process.env.RESTAURANT_PHONE,
        address_line_1: process.env.RESTAURANT_ADDRESS,
        city: process.env.RESTAURANT_CITY,
        state: process.env.RESTAURANT_STATE,
        pincode: process.env.RESTAURANT_PINCODE
      },
      delivery_details: {
        customer_name: deliveryOrder.customerName,
        customer_phone: deliveryOrder.customerPhone,
        address_line_1: deliveryOrder.deliveryAddress,
        city: deliveryOrder.deliveryCity,
        state: deliveryOrder.deliveryState,
        pincode: deliveryOrder.deliveryPincode
      },
      // Standardized food package dimensions
      package_dimensions: {
        actual_weight_kg: 1.0,
        length_cm: 30.0,
        width_cm: 20.0,
        height_cm: 10.0,
        volumetric_weight_kg: 1.0
      },
      commodity_details: {
        item_category: "Food",
        sku_code: "FOOD-ORDER",
        item_description: "Restaurant food order"
      }
    };

    const response = await fetch(`${process.env.SHADOWFAX_BASE_URL}/api/v1/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success && data.data) {
      return { 
        success: true, 
        awbNumber: data.data.awb_number, 
        pickupDate: data.data.pickup_scheduled_date 
      };
    }

    return { success: false, error: data.message || "Failed to create Shadowfax shipment." };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── Fetch Label URL ────────────────────────────────────────────────────────
export async function getLabelUrl(awbNumber) {
  try {
    const token = await getToken();
    
    const response = await fetch(`${process.env.SHADOWFAX_BASE_URL}/api/v1/orders/label?awb_number=${awbNumber}&format=pdf`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success && data.data && data.data.label_url) {
      return { success: true, labelUrl: data.data.label_url };
    }

    return { success: false, error: "Failed to fetch label URL." };
  } catch (error) {
    return { success: false, error: error.message };
  }
}