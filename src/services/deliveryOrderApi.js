// All API calls for the delivery/takeaway feature.
// Completely separate from orderApi.js (which handles dine-in only).

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Helper function to handle fetch responses and errors uniformly
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    // Throwing an error so the UI components can catch and display it via react-hot-toast
    throw new Error(data.error || data.reason || data.message || "An error occurred with the delivery API.");
  }
  return data;
};

export const checkServiceability = async (pincode) => {
  const response = await fetch(`${BASE_URL}/api/delivery-orders/check-serviceability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pincode }),
  });
  
  // Returns { serviceable, estimatedDays } or { serviceable: false, reason }
  return handleResponse(response);
};

export const placeDeliveryOrder = async (orderData) => {
  const response = await fetch(`${BASE_URL}/api/delivery-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  // Returns the created order object
  return handleResponse(response);
};

export const getDeliveryOrder = async (orderId) => {
  const response = await fetch(`${BASE_URL}/api/delivery-orders/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) return null;
  
  // Returns single order object
  return handleResponse(response);
};

export const getAllDeliveryOrders = async () => {
  const response = await fetch(`${BASE_URL}/api/delivery-orders`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Returns array of orders
  return handleResponse(response);
};

export const updateDeliveryOrderStatus = async (orderId, status) => {
  const response = await fetch(`${BASE_URL}/api/delivery-orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  // Returns updated order object
  return handleResponse(response);
};