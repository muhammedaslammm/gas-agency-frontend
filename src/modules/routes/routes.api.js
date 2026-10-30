import { apiRequest } from "../../services/api";

export function getRoutes() {
  return apiRequest("/routes");
}
