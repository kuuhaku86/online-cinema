import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../services/authApi";

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

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: "idle",
  error: null,
  registrationStatus: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = "idle";
      state.error = null;
      state.registrationStatus = "idle";
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Handle registration lifecycle
      .addCase(register.pending, (state) => {
        state.registrationStatus = "pending";
        state.error = null; // Clear previous errors
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registrationStatus = "succeeded";
        state.error = null;
        // Decide if registration should automatically log the user in.
        // If not, we just set the status. The user can then log in separately.
        // console.log('Registration successful:', action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.registrationStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
