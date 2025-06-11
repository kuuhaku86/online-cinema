import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as userApi from "../../services/usersApi";
import type { RootState } from "../../store";
import { User, setUser } from "../auth/authSlice"; // Import User and the new setUser action

interface ProfileState {
  updateLoading: "idle" | "pending" | "succeeded" | "failed";
  updateError: string | null | undefined;
}

const initialState: ProfileState = {
  updateLoading: "idle",
  updateError: null,
};

interface UpdateProfileArgs extends userApi.UpdateProfileCredentials {}

export const updateProfile = createAsyncThunk<
  User,
  UpdateProfileArgs,
  { rejectValue: string; state: RootState }
>(
  "profile/updateProfile",
  async (credentials, { getState, rejectWithValue, dispatch }) => {
    const { user } = getState().auth; // Get the whole user object

    if (!user?.access_token) {
      // Still good to check if user is authenticated
      return rejectWithValue("User not authenticated.");
    }

    try {
      // accessToken is no longer passed as an argument here,
      // as usersApi.updateProfile will use the apiClient which handles it.
      const updatedUser = await userApi.updateProfile(credentials, user.id);
      dispatch(setUser(updatedUser));

      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message || "Profile update failed");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUpdateStatus: (state) => {
      state.updateLoading = "idle";
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = "pending";
        state.updateError = null;
      })
      .addCase(
        updateProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.updateLoading = "succeeded";
          state.updateError = null;
        }
      )
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = "failed";
        state.updateError = action.payload;
      });
  },
});

export const { clearUpdateStatus } = userSlice.actions;

export default userSlice.reducer;
