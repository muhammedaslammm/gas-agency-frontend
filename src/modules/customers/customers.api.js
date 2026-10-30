import { apiRequest } from "../../services/api";

export function createCustomer(data) {
  return apiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
