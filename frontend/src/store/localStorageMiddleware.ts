import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "./index";
import {
  setSelectedVideoId,
  clearSelectedVideoId,
} from "../features/video/videoSlice";

export const localStorageMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    const result = next(action);

    if (setSelectedVideoId.match(action)) {
      try {
        if (action.payload) {
          localStorage.setItem(
            "selectedVideoId",
            JSON.stringify(action.payload)
          );
        } else {
          localStorage.removeItem("selectedVideoId");
        }
      } catch (e) {
        console.warn("Could not save selected video ID to local storage", e);
      }
    } else if (clearSelectedVideoId.match(action)) {
      localStorage.removeItem("selectedVideoId");
    }

    return result;
  };
