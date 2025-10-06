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
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";

const RoomPage: React.FC = () => {
  const selectedVideoId = useSelector(getSelectedVideoId);
  const selectedRoom = useSelector(getSelectedRoom);
  const { shortCode } = useParams<{ shortCode: string }>();
  const { videoStreamDetail, fetchVideoStreamDetail } = useVideos();
  const { user } = useAuth();
  const isOwner = user?.id === selectedRoom?.ownerId;
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
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
    if (roomStatus) {
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
  }, [roomStatus]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledUpdateStatus = useCallback(
    throttle((status: { play: boolean; time: string }) => {
      updateRoomStatus(status);
    }, 1000),
    [updateRoomStatus]
  );

  const handlePlay = () => {
    if (isOwner) {
      console.log("play", playerRef.current?.currentTime);
      setPlaying(true);
      updateRoomStatus({
        play: true,
        time: String(playerRef.current?.currentTime || 0),
      });
    }
  };

  const handlePause = () => {
    if (isOwner) {
      console.log("pause", playerRef.current?.currentTime);
      setPlaying(false);
      updateRoomStatus({
        play: false,
        time: String(playerRef.current?.currentTime || 0),
      });
    }
  };

  const handleSeeked = () => {
    if (isOwner) {
      const currentTime = playerRef.current?.currentTime || 0;
      console.log("Owner seeked to:", currentTime);
      updateRoomStatus({ play: playing, time: String(currentTime) });
    }
  };

  const handleProgress = () => {
    if (isOwner && playing) {
      throttledUpdateStatus({
        play: true,
        time: String(playerRef.current?.currentTime),
      });
    }
  };

  const handleReady = (player: ReactPlayer) => {
    if (roomStatus) {
      setPlaying(roomStatus.play);
      if (playerRef.current) {
        playerRef.current.currentTime = parseFloat(roomStatus.time);
      }
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
          <div className="relative w-full h-full">
            {videoStreamDetail && (
              <MediaController
                onClick={() => {
                  if (muted) {
                    setMuted(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (muted && (e.key === " " || e.key === "Enter"))
                    setMuted(false);
                }}
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                }}
              >
                <ReactPlayer
                  ref={playerRef}
                  width="100%"
                  height="100%"
                  src={videoStreamDetail!.urlStream}
                  muted={muted}
                  playing={playing}
                  onReady={handleReady}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onProgress={handleProgress}
                  onSeeked={handleSeeked}
                  progressInterval={1000}
                  slot="media"
                  controls={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    "--controls": "none",
                  }}
                ></ReactPlayer>
                {muted && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-2xl cursor-pointer"
                    onClick={() => setMuted(false)}
                    role="button"
                    tabIndex={0}
                  >
                    Click to unmute
                  </div>
                )}
                <MediaControlBar
                  style={{
                    gap: "20px",
                    alignItems: "center",
                    backgroundColor: "rgb(20 20 30 / .7)",
                    "--media-control-background": "transparent",
                    "--media-button-background": "transparent",
                  }}
                >
                  {!isOwner && <div style={{ flexGrow: 1 }}></div>}
                  {isOwner && <MediaPlayButton />}
                  {isOwner && <MediaSeekBackwardButton seekOffset={10} />}
                  {isOwner && <MediaSeekForwardButton seekOffset={10} />}
                  {isOwner && <MediaTimeRange />}
                  <MediaTimeDisplay showDuration />
                  <MediaMuteButton />
                  <MediaVolumeRange />
                  <MediaFullscreenButton />
                </MediaControlBar>
              </MediaController>
            )}
          </div>
        </div>
        {/* Column 2 - Chat Window */}
        <ChatWindow roomId={selectedRoom.id} />
      </div>
    </div>
  );
};

export default RoomPage;
