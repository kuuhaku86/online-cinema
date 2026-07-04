import { describe, it, expect, beforeEach } from 'vitest';
import roomReducer, { setSelectedRoom, clearSelectedRoom, getSelectedRoom } from './roomSlice';

describe('roomSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial state with null room fields', () => {
    const state = roomReducer(undefined, { type: 'unknown' });
    expect(state.selectedRoom.id).toBeNull();
    expect(state.selectedRoom.shortCode).toBeNull();
    expect(state.selectedRoom.ownerId).toBeNull();
  });

  it('should set the selected room', () => {
    const room = { id: 'room-1', shortCode: 'abc123', ownerId: 'user-1' };
    const state = roomReducer(undefined, setSelectedRoom(room));
    expect(state.selectedRoom.id).toBe('room-1');
    expect(state.selectedRoom.shortCode).toBe('abc123');
  });

  it('should clear the selected room', () => {
    const state = roomReducer(
      { selectedRoom: { id: 'room-1', shortCode: 'abc123', ownerId: 'user-1' } },
      clearSelectedRoom(),
    );
    expect(state.selectedRoom.id).toBeNull();
  });

  describe('getSelectedRoom', () => {
    it('should return the selected room from state', () => {
      const room = { id: 'room-1', shortCode: 'abc123', ownerId: 'user-1' };
      const state = { room: { selectedRoom: room } } as any;
      expect(getSelectedRoom(state)).toEqual(room);
    });
  });
});
