import { apiRequest } from "../../services/api";

export function createProduct(data) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getProducts() {
  return apiRequest("/products");
}

export function getProductsforCustomers() {
  return apiRequest("/products/customers");
}
