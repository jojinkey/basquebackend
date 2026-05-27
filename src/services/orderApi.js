import axios from "axios";

const API_URL = "http://localhost:5000/api/orders";

export const createOrder = async (orderData) => {
  const response = await axios.post(API_URL, orderData);
  return response.data;
};