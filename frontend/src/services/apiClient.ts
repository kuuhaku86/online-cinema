import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { refreshToken as refreshTokenApi } from "./authApi"; // API call for refreshing token
// If you want to type storeApi and authActions more strictly, you might import types here:
// import type { RootState, AppDispatch } from "../store";
// import type { Tokens } from "../features/auth/authSlice";

const VITE_API_HOST = import.meta.env.VITE_API_HOST;
const API_BASE_URL = import.meta.env.VITE_API_HOST + "/api";
export const LOGIN_URL = "/login"; // Your frontend login route

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

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

export const setupAxiosInterceptors = (
  storeApi: {
    getState: () => any; // Consider: () => RootState
    dispatch: (action: any) => any; // Consider: AppDispatch
  },
  authActions: {
    setTokens: (payload: { accessToken: string; refreshToken?: string }) => any; // Consider: (payload: Tokens) => PayloadAction<Tokens>
    logout: () => any; // Consider: () => AsyncThunkAction<void, void, any>
  }
) => {
  // Request Interceptor: To add the access token to requests
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = storeApi.getState().auth.user?.access_token;
      if (accessToken && config.headers) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

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
        originalRequest.url !== "/auth/refresh" // Avoid refresh loop
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

        const currentRefreshToken = storeApi.getState().auth.refreshToken;

        if (!currentRefreshToken) {
          console.error("No refresh token available for refresh attempt.");
          storeApi.dispatch(authActions.logout());
          // Optional: Redirect to login, though often handled by UI reacting to auth state
          // window.location.href = LOGIN_URL;
          return Promise.reject(error);
        }

        try {
          console.log("Attempting to refresh token...");
          const {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
          } = await refreshTokenApi(currentRefreshToken);

          storeApi.dispatch(
            authActions.setTokens({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            })
          );
          console.log("Token refreshed successfully.");

          if (originalRequest.headers) {
            originalRequest.headers["Authorization"] =
              "Bearer " + newAccessToken;
          }
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } catch (refreshError: any) {
          console.error(
            "Error refreshing token:",
            refreshError.response?.data || refreshError.message
          );
          processQueue(refreshError, null);
          storeApi.dispatch(authActions.logout());
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export default apiClient;
