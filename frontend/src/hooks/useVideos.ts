import { useState, useEffect, useCallback } from "react";
import {
  checkVideoStatusApi,
  getVideosApi,
  uploadVideoApi,
  VideoData,
  VideoStatus,
} from "../services/videosApi";

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [pollingVideoId, setPollingVideoId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!pollingVideoId) {
      return;
    }

    let isCancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const pollStatus = async () => {
      if (isCancelled) return;
      try {
        const status = await checkVideoStatusApi(pollingVideoId);
        if (isCancelled) return;

        setVideoStatus(status);

        if (status.status === "completed" || status.status === "failed") {
          if (intervalId) clearInterval(intervalId);
          setPollingVideoId(null);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("API polling error:", err);
        setError("Failed to get video status.");
        if (intervalId) clearInterval(intervalId);
        setPollingVideoId(null);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 5000);

    return () => {
      isCancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pollingVideoId]);

  const uploadVideo = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setVideoStatus(null);
    try {
      const video = await uploadVideoApi(file);
      setUploadSuccess(true);
      setPollingVideoId(video.id);
    } catch (error) {
      setUploadError("Failed to upload video. Please try again.");
      console.error("Upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, []);

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
    videoStatus,
  };
};
