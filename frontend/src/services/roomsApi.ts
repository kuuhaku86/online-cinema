import apiClient from "./apiClient";

export interface RoomData {
  id: string;
  shortCode: string;
  ownerId: string;
  userIds: string[];
  active: boolean;
  videoId: string | null;
}

export const createRoomApi = async (): Promise<RoomData> => {
  const response = await apiClient.post<RoomData>(`/rooms`);
  return response.data;
};

export const joinRoomApi = async (shortCode: string): Promise<RoomData> => {
  const response = await apiClient.post<RoomData>(`/rooms/${shortCode}/join`);
  return response.data;
};

export const startRoomApi = async (
  shortCode: string,
  videoId: string
): Promise<RoomData> => {
  const response = await apiClient.post<RoomData>(`/rooms/${shortCode}/start`, {
    video_id: videoId,
  });
  return response.data;
};
