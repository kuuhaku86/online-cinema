import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "../features/auth/authSlice";

interface Message {
  sender: {
    id: string;
    username: string;
  };
  message: string;
}

export const useChat = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const accessToken = getStoredAccessToken();

  useEffect(() => {
    const newSocket = io(serverUrl, {
      auth: {
        token: accessToken,
      },
    });
    setSocket(newSocket);

    newSocket.on("chatMessage", (payload: Message) => {
      setMessages((prevMessages) => [...prevMessages, payload]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, accessToken]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socket) {
        socket.emit("chatMessage", { message });
      }
    },
    [socket]
  );

  return { messages, sendMessage };
};
