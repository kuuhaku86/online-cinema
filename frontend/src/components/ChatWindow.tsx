import React, { useRef, useCallback, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

interface ChatWindowProps {
  roomId: string;
  onToggle?: () => void;
}

/**
 * Generates a consistent, vibrant color from a string.
 * @param str The input string (e.g., a username).
 * @returns An HSL color string.
 */
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 75%, 70%)`;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, onToggle }) => {
  const { messages, sendMessage } = useChat(
    import.meta.env.VITE_API_HOST,
    roomId
  );
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(() => {
    if (inputRef.current && inputRef.current.value.trim()) {
      sendMessage(inputRef.current.value);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }, [sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 p-5 flex flex-col border-2 rounded-lg border-[#333333] mt-5 mr-5 h-2/3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-center flex-grow">Chat</h2>
        {onToggle && (
          <button
            type="button"
            className="p-2.5 text-white hover:text-white"
            aria-label="Hide chat"
            onClick={onToggle}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-scroll mb-4 p-2 bg-[#333333] rounded-lg flex flex-col space-y-2">
        {messages.map((msg, index) => {
          const isSender = msg.sender.id === user?.id;
          return (
            <div
              key={index}
              className={`flex items-end ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-2 max-w-xs lg:max-w-md text-left ${
                  isSender ? "bg-blue-500 text-white" : "bg-gray-600 text-white"
                }`}
              >
                {!isSender && (
                  <div
                    className="font-bold text-sm"
                    style={{ color: stringToColor(msg.sender.username) }}
                  >
                    {msg.sender.username}
                  </div>
                )}
                <div>{msg.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
  );
};

export default ChatWindow;
