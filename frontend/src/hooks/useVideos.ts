import { useState, useEffect, useCallback } from "react";
import { getVideosApi, uploadVideoApi, VideoData } from "../services/videosApi";

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedVideos = await getVideosApi();
      setVideos(fetchedVideos);
    } catch (err) {
      setError("Failed to fetch videos.");
      console.error("Error on fetching videos", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const uploadVideo = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);
      try {
        await uploadVideoApi(file);
        setUploadSuccess(true);
        await fetchVideos(); // Refetch videos after successful upload
      } catch (error) {
        setUploadError("Failed to upload video. Please try again.");
        console.error("Upload error:", error);
        throw error; // Re-throw to allow component to catch if needed
      } finally {
        setUploading(false);
      }
    },
    [fetchVideos]
  );

  const clearUploadStatus = useCallback(() => {
    setUploadError(null);
    setUploadSuccess(false);
  }, []);

  return {
    videos,
    loading,
    error,
    uploadVideo,
    uploading,
    uploadError,
    uploadSuccess,
    clearUploadStatus,
  };
};