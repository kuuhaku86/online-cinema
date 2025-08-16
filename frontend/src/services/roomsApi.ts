import apiClient from "./apiClient";

export interface RoomData {
  id: string;
  shortCode?: string;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const createRoomApi = async (): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms`);

  if (response.status !== 201) {
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to create room. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const data: RoomData = response.data;
  return data;
};

export const joinRoomApi = async (shortCode: string): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms/${shortCode}/join`);

  if (response.status !== 200) {
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to join room. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const data: RoomData = response.data;
  return data;
};

export const startRoomApi = async (
  shortCode: string,
  videoId: string
): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms/${shortCode}/start`, {
    video_id: videoId,
  });

  if (response.status !== 200) {
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to start room. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const data: RoomData = response.data;
  return data;
};
