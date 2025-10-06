import React, { useState } from "react";
import ChatWindow from "./ChatWindow";

interface CollapsibleChatWindowProps {
  roomId: string;
  onToggle: (isOpen: boolean) => void;
}

const CollapsibleChatWindow: React.FC<CollapsibleChatWindowProps> = ({
  roomId,
  onToggle,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleToggle = () => {
    const newIsOpen = !isChatOpen;
    setIsChatOpen(newIsOpen);
    onToggle(newIsOpen);
  };

  if (!isChatOpen) {
    return (
      <div className="flex items-start p-2">
        <button
          type="button"
          className="p-2.5 bg-gray-700 rounded-md text-white"
          aria-label="Show chat"
          onClick={handleToggle}
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return <ChatWindow roomId={roomId} onToggle={handleToggle} />;
};

export default CollapsibleChatWindow;
