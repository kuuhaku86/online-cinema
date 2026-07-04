import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from './useAuth';

vi.mock('../../services/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}));

import authReducer from '../features/auth/authSlice';
import userReducer from '../features/user/userSlice';
import videoReducer from '../features/video/videoSlice';
import roomReducer from '../features/room/roomSlice';

function createWrapper() {
  const store = configureStore({
    reducer: { auth: authReducer, user: userReducer, video: videoReducer, room: roomReducer },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('should expose signIn, signUp, and signOut functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
