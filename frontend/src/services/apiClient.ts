import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "../store"; // Import your Redux store
import { setTokens, logout } from "../features/auth/authSlice"; // Actions from your authSlice
import { refreshToken as refreshTokenApi } from "./authApi"; // API call for refreshing token

const API_BASE_URL = import.meta.env.VITE_API_HOST + "/api";
export const LOGIN_URL = "/login"; // Your frontend login route

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request Interceptor: To add the access token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = store.getState().auth.user?.access_token;
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Refresh Token Logic ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: To handle 401s and refresh the token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = "Bearer " + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = store.getState().auth.refreshToken;

      if (!currentRefreshToken) {
        console.error("No refresh token available.");
        store.dispatch(logout()); // Dispatch logout from authSlice
        // window.location.href = LOGIN_URL; // Handled by auth state listener in App/Router
        return Promise.reject(error);
      }

      try {
        console.log("Attempting to refresh token...");
        // Use the refreshTokenApi function which should internally use a basic axios/fetch
        // or a separate axios instance NOT using these interceptors to avoid loops.
        const { access_token: newAccessToken, refresh_token: newRefreshToken } =
          await refreshTokenApi(currentRefreshToken);

        store.dispatch(
          setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          })
        );
        console.log("Token refreshed successfully.");

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "Error refreshing token:",
          refreshError.response?.data || refreshError.message
        );
        processQueue(refreshError, null);
        store.dispatch(logout()); // Dispatch logout from authSlice
        // window.location.href = LOGIN_URL; // Handled by auth state listener in App/Router
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
