import React, { useEffect, useState, useRef, useCallback } from "react";
import { getSelectedVideoId } from "../features/video/videoSlice";
import { useSelector } from "react-redux";
import { useVideos } from "../hooks/useVideos";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { getSelectedRoom } from "../features/room/roomSlice";
import ChatWindow from "../components/ChatWindow";
import { useAuth } from "../hooks/useAuth";
import { useRoomStatus } from "../hooks/useRoomStatus";
import { throttle } from "lodash";

const RoomPage: React.FC = () => {
  const selectedVideoId = useSelector(getSelectedVideoId);
  const selectedRoom = useSelector(getSelectedRoom);
  const { shortCode } = useParams<{ shortCode: string }>();
  const { videoStreamDetail, fetchVideoStreamDetail } = useVideos();
  const { user } = useAuth();
  const [volume, setVolume] = useState(0.8);
  const isOwner = user?.id === selectedRoom?.ownerId;
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const seekingRef = useRef(false);

  const { roomStatus, updateRoomStatus } = useRoomStatus(
    import.meta.env.VITE_API_HOST || "http://localhost:3001",
    selectedRoom?.id
  );

  useEffect(() => {
    if (selectedVideoId && shortCode && selectedRoom) {
      fetchVideoStreamDetail(selectedRoom.id, selectedVideoId);
    }
  }, [selectedVideoId, selectedRoom, fetchVideoStreamDetail, shortCode]);

  // Effect to synchronize player state from incoming room status
  useEffect(() => {
    if (roomStatus && isReady) {
      setPlaying(roomStatus.play);

      const localTime = playerRef.current?.currentTime || 0;
      const remoteTime = parseFloat(roomStatus.time);

      // Only seek if the time difference is significant, to avoid small jumps.
      if (Math.abs(localTime - remoteTime) > 2) {
        seekingRef.current = true;
        if (playerRef.current) {
          playerRef.current.currentTime = remoteTime;
        }
      }
    }
  }, [roomStatus, isReady]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledUpdateStatus = useCallback(
    throttle((status: { play: boolean; time: string }) => {
      updateRoomStatus(status);
    }, 1000),
    [updateRoomStatus]
  );

  const handlePlay = () => {
    if (isOwner) {
      setPlaying(true);
      updateRoomStatus({
        play: true,
        time: String(playerRef.current?.currentTime || 0),
      });
    }
  };

  const handlePause = () => {
    if (isOwner) {
      setPlaying(false);
      updateRoomStatus({
        play: false,
        time: String(playerRef.current?.currentTime || 0),
      });
    }
  };

  const handleSeek = (seconds: number) => {
    if (isOwner) {
      if (seekingRef.current) {
        seekingRef.current = false;
        return;
      }
      updateRoomStatus({ play: playing, time: String(seconds) });
    }
  };

  const handleProgress = (progress: { playedSeconds: number }) => {
    if (isOwner && playing) {
      throttledUpdateStatus({
        play: true,
        time: String(progress.playedSeconds),
      });
    }
  };

  const handleReady = (player: ReactPlayer) => {
    setIsReady(true);
    if (roomStatus) {
      setPlaying(roomStatus.play);
      if (playerRef.current) {
        playerRef.current.currentTime = parseFloat(roomStatus.time);
      }
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      (playerRef.current as HTMLElement)?.requestFullscreen();
    }
  };

  if (!selectedRoom) {
    // A better loading/error state could be implemented here.
    return <div>Loading room...</div>;
  }

  return (
    <div className="h-[90vh] flex flex-col">
      {/* Parent 2: Flex container for columns. Removed h-screen and min-h-screen. flex-1 will make it fill Parent 1. */}
      <div className="flex gap-5 flex-1">
        {/* Column 1 */}
        <div className="flex-[3] p-5 flex flex-col justify-center items-center text-center">
          {videoStreamDetail && (
            <ReactPlayer
              ref={playerRef}
              width="100%"
              height="100%"
              src={videoStreamDetail!.urlStream}
              playing={playing}
              controls={isOwner}
              volume={isOwner ? undefined : volume}
              onReady={handleReady}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onProgress={handleProgress}
              progressInterval={1000}
            />
          )}
          {!isOwner && videoStreamDetail && (
            <div className="w-full max-w-md mt-4 flex items-center gap-4">
              <div className="flex-grow">
                <label
                  htmlFor="volume-slider"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Volume
                </label>
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              <button
                onClick={handleFullscreen}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
              >
                Fullscreen
              </button>
            </div>
          )}
        </div>
        {/* Column 2 - Chat Window */}
        <ChatWindow roomId={selectedRoom.id} />
      </div>
    </div>
  );
};

export default RoomPage;
