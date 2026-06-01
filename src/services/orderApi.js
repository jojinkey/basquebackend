import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api/orders`;

const QUEUE_KEY = "basque_offline_orders";

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
    const queue = getQueue();

    queue.push({
      ...orderData,
      queuedAt: new Date().toISOString(),
    });

    saveQueue(queue);

    return {
      offline: true,
      message:
        "Order saved offline. It will sync automatically.",
    };
  }
};

export const syncOfflineOrders = async () => {
  const queue = getQueue();

  if (queue.length === 0) return;

  const remainingOrders = [];

  for (const order of queue) {
    try {
      await axios.post(API_URL, order);
    } catch (error) {
      remainingOrders.push(order);
    }
  }

  saveQueue(remainingOrders);

  return remainingOrders.length;
};

export const getOfflineOrders = () => {
  return getQueue();
};