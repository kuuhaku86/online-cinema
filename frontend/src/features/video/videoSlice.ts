import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../store";

interface VideoState {
  selectedVideoId: string | null;
}

const loadInitialState = (): VideoState => {
  try {
    const serializedId = localStorage.getItem("selectedVideoId");
    if (serializedId === null) {
      return { selectedVideoId: null };
    }
    return { selectedVideoId: JSON.parse(serializedId) };
  } catch (err) {
    console.warn("Could not load selected video ID from storage", err);
    return { selectedVideoId: null };
  }
};

const initialState: VideoState = loadInitialState();

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    // Action to set the ID of the video the user has selected
    setSelectedVideoId: (state, action: PayloadAction<string | null>) => {
      state.selectedVideoId = action.payload;
    },
    // Action to clear the selected video ID, e.g., when leaving a video page
    clearSelectedVideoId: (state) => {
      state.selectedVideoId = null;
    },
  },
});

export const { setSelectedVideoId, clearSelectedVideoId } = videoSlice.actions;

export const getSelectedVideoId = (state: RootState) =>
  state.video.selectedVideoId;

export default videoSlice.reducer;
