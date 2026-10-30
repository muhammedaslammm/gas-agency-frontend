import { apiRequest } from "../../services/api";

export const getStockPurchases = () => apiRequest("/purchases");

export const getSuppliersforPurchase = () => apiRequest("/suppliers/purchase");

export const getProductsforPurchase = () => apiRequest("/products/select");

export const createPurchase = (payload) =>
  apiRequest("/purchases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
