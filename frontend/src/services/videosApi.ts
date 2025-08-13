import apiClient from "./apiClient";

export interface VideoData {
  id: string;
  fileName: string | null;
}

interface RawVideoApiResponse {
  videoId: string;
  fileName: string | null;
  message: string | null;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface VideoStatus {
  status: "pending" | "processing" | "completed" | "failed";
  originalFileName?: string | undefined;
  processedPath?: string;
  error?: string;
}

export const uploadVideoApi = async (file: File): Promise<VideoData> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(`/videos/upload`, formData);

  if (response.status !== 201) {
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
  const newVideoData: VideoData = {
    id: rawData.videoId,
    fileName: null,
  };
  return newVideoData;
};

export const checkVideoStatusApi = async (
  videoId: string
): Promise<VideoStatus> => {
  const response = await apiClient.get(`/videos/status/` + videoId);

  if (response.status !== 200) {
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to check video status. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  return response.data;
};

export const getVideosApi = async (): Promise<VideoData[]> => {
  const response = await apiClient.get(`/videos`);
  if (response.status !== 200) {
    const errorData: ApiErrorResponse = response.data;
    const errorMessage =
      errorData.message ||
      errorData.error ||
      `Failed to get videos. Status: ${response.status} - ${
        response.statusText || "Unknown error"
      }`;
    throw new Error(errorMessage);
  }

  const rawData: RawVideoApiResponse[] = response.data;

  return rawData.map((video) => ({
    id: video.videoId,
    fileName: video.fileName,
  }));
};
