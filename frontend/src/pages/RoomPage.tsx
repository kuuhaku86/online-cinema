import React, { useEffect, useRef, useCallback } from "react";
import { getSelectedVideoId } from "../features/video/videoSlice";
import { useSelector } from "react-redux";
import { useVideos } from "../hooks/useVideos";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import { getSelectedRoom } from "../features/room/roomSlice";
import { useChat } from "../hooks/useChat";

const RoomPage: React.FC = () => {
  const selectedVideoId = useSelector(getSelectedVideoId);
  const selectedRoom = useSelector(getSelectedRoom);
  const { shortCode } = useParams<{ shortCode: string }>();
  const { videoStreamDetail, fetchVideoStreamDetail } = useVideos();
  const { messages, sendMessage } = useChat(import.meta.env.VITE_API_HOST);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedVideoId && shortCode) {
      fetchVideoStreamDetail(selectedRoom.id, selectedVideoId);
    }
  }, [selectedVideoId, selectedRoom, fetchVideoStreamDetail]);

  console.log("Selected Video", selectedVideoId);

  const handleSendMessage = useCallback(() => {
    if (inputRef.current && inputRef.current.value.trim()) {
      sendMessage(inputRef.current.value);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [sendMessage]);

  return (
    <div className="h-[90vh] flex flex-col">
      {/* Parent 2: Flex container for columns. Removed h-screen and min-h-screen. flex-1 will make it fill Parent 1. */}
      <div className="flex gap-5 flex-1">
        {/* Column 1 */}
        <div className="flex-[3] p-5 flex flex-col justify-center items-center text-center">
          {videoStreamDetail && (
            <ReactPlayer
              src={videoStreamDetail!.urlStream}
              style={{
                width: "100%",
                height: "100%",
              }}
              controls
            />
          )}
        </div>
        {/* Column 2 - Chat Window */}
        <div className="flex-1 p-5 flex flex-col border-2 rounded-lg border-[#333333] mt-5 mr-5">
          <h2 className="text-xl font-bold mb-4 text-center">Chat</h2>
          <div className="flex-grow overflow-y-auto mb-4 p-2 bg-[#333333] rounded-lg">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2 text-left">
                <span className="font-bold">{msg.sender.username}:</span>{" "}
                {msg.message}
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              ref={inputRef}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-grow bg-[#333333] border-[#333333] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 placeholder-gray-400"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
