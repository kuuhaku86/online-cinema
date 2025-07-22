import apiClient from "./apiClient";

export interface VideoData {
  id: string;
}

interface RawVideoApiResponse {
  videoId: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const uploadVideoApi = async (file: File): Promise<VideoData> => {
  const formData = new FormData();
  // The key "file" must match the field name the backend is expecting (e.g., from multer).
  formData.append("file", file);

  // When passing a FormData object to axios, it automatically sets the
  // correct 'Content-Type' header with the boundary. Do not set it manually.
  const response = await apiClient.post(`/videos/upload`, formData);

  if (response.status !== 201) {
    // Axios automatically parses JSON responses, so response.data is already the object.
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to upload videos. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const rawData: RawVideoApiResponse = response.data;
  const newRoomData: VideoData = {
    id: rawData.videoId,
  };
  return newRoomData;
};
