import axios from "axios";

// .env.local mein VITE_API_URL set karke badal sakte ho
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor (attach access token)
api.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // access token expired
    const refreshToken = localStorage.getItem("refreshToken");
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );
        sessionStorage.setItem("accessToken", res.data.accessToken);
        // backend refresh token rotate karta hai, naya wala save karna zaroori hai
        localStorage.setItem("refreshToken", res.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

        return api(originalRequest);
      } catch (e) {
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
