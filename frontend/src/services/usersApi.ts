import { User } from "../features/auth/authSlice";
import apiClient from "./apiClient";

export interface UpdateProfileCredentials {
  username?: string;
  email?: string;
  newPassword?: string;
  oldPassword?: string;
}

export const updateProfile = async (
  credentials: UpdateProfileCredentials,
  userId: string
): Promise<User> => {
  const response = await apiClient.patch<User>(`/users/${userId}`, credentials);
  return response.data;
};
