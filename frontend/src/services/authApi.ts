import axios from "axios"; // For direct refresh token call
import {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../features/auth/authSlice";
import apiClient from "./apiClient"; // Import the new apiClient

const API_BASE_URL = "/api/auth";

export const login = async (credentials: LoginCredentials): Promise<User> => {
  // Use apiClient for consistency, though login doesn't strictly need interceptors for outgoing token
  // const response = await apiClient.post(`/auth/login`, credentials);
  const response = await fetch(`${API_BASE_URL}/login`, {
    // Login usually doesn't send an existing token
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
  const data = await response.json();
  return data;
};

export const register = async (
  credentials: RegisterCredentials
): Promise<Omit<User, "access_token" | "refresh_token">> => {
  // Backend register doesn't return tokens
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message;
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const logout = async (): Promise<void> => {
  // apiClient will automatically add the Authorization header
  await apiClient.post(`/auth/logout`);
};

// This function should use a basic axios instance or fetch directly
// to avoid interceptor loops if the refresh token itself is invalid.
export const refreshToken = async (
  currentRefreshToken: string
): Promise<{ access_token: string; refresh_token: string }> => {
  const response = await axios.post(
    `${API_BASE_URL}/refresh`, // Ensure this matches your backend refresh endpoint
    { refreshToken: currentRefreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  if (response.status !== 200 && response.status !== 201) {
    // NestJS refresh returns 201 by default on POST
    const errorData = response.data;
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message;
    throw new Error(message || `HTTP error! status: ${response.status}`);
  }

  return response.data; // Expects { access_token: string, refresh_token: string }
};
