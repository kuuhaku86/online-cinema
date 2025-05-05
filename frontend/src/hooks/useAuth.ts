import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import {
  login,
  logout,
  register,
  LoginCredentials,
  RegisterCredentials,
} from "../features/auth/authSlice";
import { useCallback } from "react";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading, error, registrationStatus } =
    useSelector((state: RootState) => state.auth);

  const signIn = useCallback(
    (credentials: LoginCredentials) => {
      dispatch(login(credentials));
    },
    [dispatch]
  );

  const signUp = useCallback(
    (credentials: RegisterCredentials) => {
      dispatch(register(credentials));
    },
    [dispatch]
  );

  const signOut = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signOut,
    registrationStatus,
    signUp,
  };
};
