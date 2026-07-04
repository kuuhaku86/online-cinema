import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  setUser,
  setTokens,
  login,
  register,
  logout,
  getStoredAccessToken,
  User,
} from './authSlice';

vi.mock('../../services/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

describe('authSlice', () => {
  const initialState = {
    user: null as User | null,
    isAuthenticated: false,
    loading: 'idle' as const,
    error: null as string | null | undefined,
    registrationStatus: 'idle' as const,
    refreshToken: null as string | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return the initial state', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  describe('setUser', () => {
    it('should set user properties when user exists', () => {
      const withUser = {
        ...initialState,
        user: { id: '1', username: 'old', email: 'old@o.com', access_token: 'at', refresh_token: 'rt' },
      };
      const state = authReducer(withUser, setUser({ id: '1', username: 'new', email: 'n@n.com', access_token: 'at2', refresh_token: 'rt2' }));
      expect(state.user!.username).toBe('new');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setTokens', () => {
    it('should not update tokens when user is null', () => {
      const state = authReducer(initialState, setTokens({ accessToken: 'new-access' }));
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('getStoredAccessToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('accessToken', 'stored-token');
      expect(getStoredAccessToken()).toBe('stored-token');
    });

    it('should return null if no token stored', () => {
      expect(getStoredAccessToken()).toBeNull();
    });
  });

  describe('login thunk', () => {
    it('should set loading to pending', () => {
      const state = authReducer(initialState, { type: login.pending.type });
      expect(state.loading).toBe('pending');
      expect(state.error).toBeNull();
    });

    it('should populate state on fulfilled', () => {
      const user: User = { id: '1', username: 'test', email: 't@t.com', access_token: 'at', refresh_token: 'rt' };
      const state = authReducer(initialState, login.fulfilled(user, '', { email: 't@t.com', password: 'p' }));
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe('succeeded');
      expect(state.refreshToken).toBe('rt');
    });

    it('should set loading to failed on rejected', () => {
      const state = authReducer(initialState, login.rejected(new Error('fail'), '', { email: 't@t.com', password: 'p' }));
      expect(state.loading).toBe('failed');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('register thunk', () => {
    it('should set registrationStatus to pending', () => {
      const state = authReducer(initialState, { type: register.pending.type });
      expect(state.registrationStatus).toBe('pending');
    });

    it('should set to succeeded on fulfilled', () => {
      const state = authReducer(initialState, register.fulfilled({ id: '1', username: 'new', email: 'n@n.com' }, '', { username: 'new', email: 'n@n.com', password: 'p' }));
      expect(state.registrationStatus).toBe('succeeded');
    });

    it('should set loading to failed on rejected', () => {
      const state = authReducer(initialState, register.rejected(new Error('dup'), '', { username: 'new', email: 'n@n.com', password: 'p' }));
      expect(state.registrationStatus).toBe('failed');
    });
  });

  describe('logout thunk', () => {
    it('should clear auth state on fulfilled', () => {
      const loggedIn = { user: { id: '1', username: 't', email: 'e@e.com', access_token: 'at', refresh_token: 'rt' }, isAuthenticated: true, loading: 'idle' as const, error: null, registrationStatus: 'idle' as const, refreshToken: 'rt' as string | null };
      const state = authReducer(loggedIn, logout.fulfilled(undefined, '', undefined));
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.refreshToken).toBeNull();
    });
  });
});
