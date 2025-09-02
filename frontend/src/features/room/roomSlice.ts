import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

interface RoomState {
  selectedRoom: {
    id: string | null;
    shortCode: string | null;
  };
}

const loadInitialState = (): RoomState => {
  try {
    const serializedData = localStorage.getItem("selectedRoom");
    if (serializedData === null) {
      return { selectedRoom: { id: null, shortCode: null } };
    }
    return { selectedRoom: JSON.parse(serializedData) };
  } catch (err) {
    console.warn("Could not load selected video ID from storage", err);
    return { selectedRoom: { id: null, shortCode: null } };
  }
};

const initialState: RoomState = loadInitialState();

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    // Action to set the ID of the video the user has selected
    setSelectedRoom: (
      state,
      action: PayloadAction<{ id: string; shortCode: string } | null>
    ) => {
      state.selectedRoom.id = action.payload!.id;
      state.selectedRoom.shortCode = action.payload!.shortCode;
    },
    // Action to clear the selected video ID, e.g., when leaving a video page
    clearSelectedRoom: (state) => {
      state.selectedRoom = { id: null, shortCode: null };
    },
  },
});

export const { setSelectedRoom, clearSelectedRoom } = roomSlice.actions;

export const getSelectedRoom = (state: RootState) => state.room.selectedRoom;

export default roomSlice.reducer;
