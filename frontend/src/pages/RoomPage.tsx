import React, { useEffect, useState, useRef, useCallback } from "react";
import { getSelectedVideoId } from "../features/video/videoSlice";
import { useSelector } from "react-redux";
import { useVideos } from "../hooks/useVideos";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { getSelectedRoom } from "../features/room/roomSlice";
import { useAuth } from "../hooks/useAuth";
import { useRoomStatus } from "../hooks/useRoomStatus";
import CollapsibleChatWindow from "../components/CollapsibleChatWindow";
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
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [muted, setMuted] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const seekingRef = useRef(false);

  const { roomStatus, updateRoomStatus } = useRoomStatus(
    "",
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

  const handleCopyCode = () => {
    if (!shortCode) return;

    // Use modern Clipboard API if available (secure contexts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shortCode).then(
        () => {
          setCopyButtonText("Copied!");
          setTimeout(() => setCopyButtonText("Copy"), 2000);
        },
        (err) => {
          console.error("Async: Could not copy text: ", err);
          setCopyButtonText("Failed");
          setTimeout(() => setCopyButtonText("Copy"), 2000);
        }
      );
    } else {
      // Fallback for older browsers or insecure contexts
      const textArea = document.createElement("textarea");
      textArea.value = shortCode;
      textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          setCopyButtonText("Copied!");
          setTimeout(() => setCopyButtonText("Copy"), 2000);
        }
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!selectedRoom) {
    // A better loading/error state could be implemented here.
    return <div>Loading room...</div>;
  }

  return (
    <div className="h-[90vh] flex flex-col">
      <div className="p-1 flex items-center justify-center gap-2 rounded-lg mb-1 mx-2">
        <span className="text-white font-medium">Room Code:</span>
        <code className="text-lg font-bold text-red-400 px-1 py-1 rounded">
          {shortCode}
        </code>
        <button
          onClick={handleCopyCode}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded text-sm transition-all duration-200 ease-in-out"
        >
          {copyButtonText}
        </button>
      </div>
      {/* Parent 2: Flex container for columns. Removed h-screen and min-h-screen. flex-1 will make it fill Parent 1. */}
      <div className="flex gap-5 flex-1">
        {/* Column 1 */}
        <div
          className={`p-5 flex flex-col justify-center items-center text-center ${
            isChatOpen ? "flex-[3]" : "flex-1"
          }`}
        >
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
        <CollapsibleChatWindow
          roomId={selectedRoom.id}
          onToggle={setIsChatOpen}
        />
      </div>
    </div>
  );
};

export default RoomPage;
