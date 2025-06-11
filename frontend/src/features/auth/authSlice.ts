import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../services/authApi";
import type { RootState } from "../../store";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null | undefined;
  registrationStatus: "idle" | "pending" | "succeeded" | "failed";
  refreshToken: string | null;
}

// This is the type for the payload of setTokens
interface Tokens {
  accessToken: string;
  refreshToken?: string; // Optional if backend doesn't always rotate refresh tokens
}

export const login = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const user = await authApi.login(credentials);
    localStorage.setItem("accessToken", user.access_token);
    localStorage.setItem("refreshToken", user.refresh_token);
    return user;
  } catch (error: any) {
    return rejectWithValue(error.message || "Login failed");
  }
});

export const register = createAsyncThunk<
  Omit<User, "access_token" | "refresh_token">,
  RegisterCredentials,
  { rejectValue: string }
>("auth/registerUser", async (credentials, { rejectWithValue }) => {
  try {
    const newUser = await authApi.register(credentials);
    return newUser;
  } catch (error: any) {
    return rejectWithValue(error.message || "Registration failed");
  }
});

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string; state: RootState }
>("auth/logout", async (_, { getState, rejectWithValue }) => {
  const token = getState().auth.user?.access_token;
  let apiError: any = null;

  if (token) {
    try {
      await authApi.logout();
    } catch (error: any) {
      apiError = error;
      console.error("Server logout API call failed:", error.message);
    }
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  if (apiError) {
    return rejectWithValue(
      apiError.message || "Server logout failed, but client state cleared."
    );
  }
});

const decodeTokenAndCheckExpiry = (
  token: string
): { id: string; username: string; email: string } | null => {
  try {
    const payloadBase64Url = token.split(".")[1];
    if (!payloadBase64Url) {
      return null;
    }
    const payloadBase64 = payloadBase64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(payloadBase64));

    if (
      decodedPayload &&
      decodedPayload.exp &&
      decodedPayload.sub &&
      decodedPayload.username &&
      decodedPayload.email
    ) {
      if (decodedPayload.exp * 1000 > Date.now()) {
        return {
          id: decodedPayload.sub,
          username: decodedPayload.username,
          email: decodedPayload.email,
        };
      }
    }
  } catch (error) {
    console.error("Failed to decode or validate token:", error);
  }
  return null;
};

const getInitialAuthState = (): AuthState => {
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");

  if (accessToken && refreshToken) {
    const decodedUserDetails = decodeTokenAndCheckExpiry(accessToken);

    if (decodedUserDetails) {
      return {
        user: {
          ...decodedUserDetails,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
        isAuthenticated: true,
        loading: "idle",
        error: null,
        registrationStatus: "idle",
        refreshToken,
      };
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    loading: "idle",
    error: null,
    registrationStatus: "idle",
    refreshToken: null,
  };
};

// Helper functions for localStorage
const getStoredUser = (): User | null => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user!.email = action.payload.email;
      state.user!.username = action.payload.username;
      state.isAuthenticated = true;
    },
    setTokens: (state, action: PayloadAction<Tokens>) => {
      if (state.user) {
        state.user.access_token = action.payload.accessToken;
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("user", JSON.stringify(state.user));
      }
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        if (state.user) state.user.refresh_token = action.payload.refreshToken; // keep user object consistent
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = "pending";
        state.error = null;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload;
        state.refreshToken = action.payload.refresh_token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.registrationStatus = "pending";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registrationStatus = "succeeded";
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.registrationStatus = "failed";
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = "idle";
        state.error = null;
        state.registrationStatus = "idle";
        state.refreshToken = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = "idle";
        state.error = action.payload;
        state.registrationStatus = "idle";
      });
  },
});

export const { setUser, setTokens } = authSlice.actions;

export default authSlice.reducer;
