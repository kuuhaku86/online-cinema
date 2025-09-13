import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "../features/auth/authSlice";

interface ChatMessage {
  sender: {
    id: string;
    username: string;
  };
  message: string;
  createdAt: string;
}

interface BackendMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
}

export const useChat = (serverUrl: string, roomId: string | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const accessToken = getStoredAccessToken();

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(serverUrl, {
      auth: {
        token: accessToken,
      },
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected successfully, joining room:", roomId);
      newSocket.emit("joinRoom", { roomId });
    });

    newSocket.on("connect_error", (err: any) => {
      console.error("Socket connection failed:", err.message);
    });

    newSocket.on("previousMessages", (payload: BackendMessage[]) => {
      const formattedMessages: ChatMessage[] = payload.map((msg) => ({
        sender: {
          id: msg.user.id,
          username: msg.user.username,
        },
        message: msg.text,
        createdAt: msg.createdAt,
      }));
      setMessages(formattedMessages);
    });

    newSocket.on("chatMessage", (payload: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, payload]);
    });

    newSocket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, accessToken, roomId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket && roomId) {
        socket.emit("chatMessage", { message, roomId });
      }
    },
    [socket, roomId]
  );

  return { messages, sendMessage };
};
