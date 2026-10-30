import { apiRequest } from "../../services/api";

export const getSales = () => apiRequest("/sales");

export const getCustomersForSale = () => apiRequest("/customers/lookup");

export const getCustomerForSale = (customerId) =>
  apiRequest(`/customers/${customerId}/lookup`);

export const getProductsForSale = () => apiRequest("/products");

export const createSale = (saleData) =>
  apiRequest("/sales", {
    method: "POST",
    body: JSON.stringify(saleData),
  });
