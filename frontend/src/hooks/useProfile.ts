import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import {
  updateProfile,
  clearUpdateStatus,
} from "../features/user/userSlice";
import { UpdateProfileCredentials } from "../services/usersApi"; // Import credentials type
import { useCallback } from "react";

export const useProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  // Get user data from auth slice (where the current user info resides)
  const user = useSelector((state: RootState) => state.auth.user);
  // Get update state from profile slice (manages the update operation status)
  const { updateLoading, updateError } = useSelector(
    (state: RootState) => state.profile
  );

  const handleUpdateProfile = useCallback(
    (credentials: UpdateProfileCredentials) => {
      dispatch(updateProfile(credentials));
    },
    [dispatch]
  );

  const handleClearUpdateStatus = useCallback(() => {
    dispatch(clearUpdateStatus());
  }, [dispatch]);

  return {
    user, // Current user data from auth slice
    updateLoading,
    updateError,
    updateProfile: handleUpdateProfile,
    clearUpdateStatus: handleClearUpdateStatus,
  };
};
