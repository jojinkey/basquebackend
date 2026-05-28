import axios from "axios";

const API_URL = "http://localhost:5000/api/service-requests";

export const callWaiter = async (data) => {
  const response = await axios.post(API_URL, {
    ...data,
    type: "call_waiter",
  });

  return response.data;
};

export const requestBill = async (data) => {
  const response = await axios.post(API_URL, {
    ...data,
    type: "bill_request",
  });

  return response.data;
};