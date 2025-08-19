import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/user/userSlice"; // Import the user reducer
import videoReducer from "../features/video/videoSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: userReducer, // Add the user reducer under the key 'profile'
    video: videoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
