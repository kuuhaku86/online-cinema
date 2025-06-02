import { User } from "../features/auth/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_HOST + "/api/users";

export interface UpdateProfileCredentials {
  username?: string;
  email?: string;
  newPassword?: string;
  oldPassword?: string;
}

export const updateProfile = async (
  credentials: UpdateProfileCredentials,
  accessToken: string,
  userId: string
): Promise<User> => {
  const response = await fetch(API_BASE_URL + userId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
