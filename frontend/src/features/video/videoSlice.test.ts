import { describe, it, expect, beforeEach } from 'vitest';
import videoReducer, { setSelectedVideoId, clearSelectedVideoId, getSelectedVideoId } from './videoSlice';

describe('videoSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state with null selectedVideoId', () => {
    const state = videoReducer(undefined, { type: 'unknown' });
    expect(state.selectedVideoId).toBeNull();
  });

  it('should set the selected video ID', () => {
    const state = videoReducer({ selectedVideoId: null }, setSelectedVideoId('video-123'));
    expect(state.selectedVideoId).toBe('video-123');
  });

  it('should clear the selected video ID', () => {
    const state = videoReducer({ selectedVideoId: 'video-123' }, clearSelectedVideoId());
    expect(state.selectedVideoId).toBeNull();
  });

  describe('getSelectedVideoId', () => {
    it('should return the selected video ID from state', () => {
      const state = { video: { selectedVideoId: 'video-456' } } as any;
      expect(getSelectedVideoId(state)).toBe('video-456');
    });

    it('should return null when no video is selected', () => {
      const state = { video: { selectedVideoId: null } } as any;
      expect(getSelectedVideoId(state)).toBeNull();
    });
  });
});
