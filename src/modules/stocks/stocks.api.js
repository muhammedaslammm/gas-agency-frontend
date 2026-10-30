import { apiRequest } from "../../services/api";

export const getStockPurchases = () => apiRequest("/stock-purchases");
