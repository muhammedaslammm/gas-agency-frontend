const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const apiRequest = async (urlEndpoint, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${urlEndpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return data;
};
