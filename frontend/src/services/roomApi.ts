import apiClient from "./apiClient";

export interface RoomData {
  id: string;
  roomCode?: string;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const createRoomApi = async (): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms`);

  if (response.status !== 201) {
    let errorMessage = "Failed to create room.";
    try {
      const errorData: ApiErrorResponse = await response.data.json();
      errorMessage =
        errorData.message ||
        errorData.error ||
        `Failed to create room. Status: ${response.status}`;
    } catch (e) {
      errorMessage = `Failed to create room. Status: ${response.status} - ${
        response.statusText || "Server error"
      }`;
    }
    throw new Error(errorMessage);
  }

  const newRoomData: RoomData = await response.data;
  return newRoomData;
};
