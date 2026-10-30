import { apiRequest } from "../../services/api";

export const getCurrentUser = () => {
  return apiRequest("/auth/me");
};

export const loginUser = (credentials) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const logoutUser = () => {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
};
