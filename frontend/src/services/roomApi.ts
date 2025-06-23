import apiClient from "./apiClient";

export interface RoomData {
  id: string;
  shortCode?: string; // This is the camelCase property for frontend use
  message?: string;
}

interface RawRoomApiResponse {
  id: string;
  short_code?: string; // Assuming the backend sends this
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const createRoomApi = async (): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms`);

  if (response.status !== 201) {
    // Axios automatically parses JSON responses, so response.data is already the object.
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to create room. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const rawData: RawRoomApiResponse = response.data;
  const newRoomData: RoomData = {
    id: rawData.id,
    shortCode: rawData.short_code, // Explicitly map short_code to shortCode
    message: rawData.message,
  };
  return newRoomData;
};

export const joinRoomApi = async (shortCode: string): Promise<RoomData> => {
  const response = await apiClient.post(`/rooms/${shortCode}/join`);

  if (response.status !== 200) {
    // Assuming 200 OK for successful join
    // Axios automatically parses JSON responses, so response.data is already the object.
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to join room. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const rawData: RawRoomApiResponse = response.data;
  const roomData: RoomData = {
    id: rawData.id,
    shortCode: rawData.short_code, // Explicitly map short_code to shortCode
    message: rawData.message,
  };
  return roomData;
};
