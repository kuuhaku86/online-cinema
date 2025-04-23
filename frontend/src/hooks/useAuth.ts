import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { login, logout } from "../features/auth/authSlice";
import { useCallback } from "react";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const signIn = useCallback(
    (userData: typeof user) => {
      if (userData) dispatch(login(userData));
    },
    [dispatch]
  );

  const signOut = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    signIn,
    signOut,
  };
};
