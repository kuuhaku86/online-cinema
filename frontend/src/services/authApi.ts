import {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../features/auth/authSlice";

const API_BASE_URL = "/auth";

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
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
  return data.user;
};

export const register = async (
  credentials: RegisterCredentials
): Promise<Omit<User, "access_token" | "refresh_token">> => {
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
