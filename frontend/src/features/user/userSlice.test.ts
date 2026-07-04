import { describe, it, expect, beforeEach, vi } from 'vitest';
import userReducer, { updateProfile, clearUpdateStatus } from './userSlice';

vi.mock('../../services/usersApi', () => ({
  updateProfile: vi.fn(),
}));

describe('userSlice', () => {
  const initialState = { updateLoading: 'idle' as const, updateError: null as string | null | undefined };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('clearUpdateStatus', () => {
    it('should reset loading and error', () => {
      const state = userReducer(
        { updateLoading: 'failed', updateError: 'some error' },
        clearUpdateStatus(),
      );
      expect(state.updateLoading).toBe('idle');
      expect(state.updateError).toBeNull();
    });
  });

  describe('updateProfile thunk', () => {
    it('should set updateLoading to pending', () => {
      const state = userReducer(initialState, { type: updateProfile.pending.type });
      expect(state.updateLoading).toBe('pending');
      expect(state.updateError).toBeNull();
    });

    it('should set updateLoading to succeeded on fulfilled', () => {
      const state = userReducer(initialState, updateProfile.fulfilled(
        { id: '1', username: 'u', email: 'e@e.com', access_token: 'at', refresh_token: 'rt' },
        '',
        {} as any,
      ));
      expect(state.updateLoading).toBe('succeeded');
      expect(state.updateError).toBeNull();
    });

    it('should set updateLoading to failed on rejected', () => {
      const state = userReducer(initialState, updateProfile.rejected(
        new Error('fail'), '', {} as any,
      ));
      expect(state.updateLoading).toBe('failed');
    });
  });
});
