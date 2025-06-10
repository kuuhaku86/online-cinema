import { User } from "../features/auth/authSlice";
import apiClient from "./apiClient"; // Import the new apiClient

// const API_BASE_URL = import.meta.env.VITE_API_HOST + "/api/users"; // Base URL is now in apiClient

export interface UpdateProfileCredentials {
  username?: string;
  email?: string;
  newPassword?: string;
  oldPassword?: string;
}

export const updateProfile = async (
  credentials: UpdateProfileCredentials,
  // accessToken: string, // No longer needed, apiClient handles it
  userId: string
): Promise<User> => {
  // The apiClient will automatically add the Authorization header.
  // The URL will be relative to the apiClient's baseURL.
  const response = await apiClient.patch<User>(`/users/${userId}`, credentials);
  return response.data;
};
