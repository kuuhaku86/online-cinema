import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getStoredAccessToken } from "../features/auth/authSlice";

// Based on backend RoomGateway
interface RoomStatus {
  time: string;
  play: boolean;
}

export const useRoomStatus = (
  serverUrl: string,
  roomId: string | undefined
) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const accessToken = getStoredAccessToken();

  useEffect(() => {
    if (!roomId) {
      setRoomStatus(null);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(`${serverUrl}/room`, {
      auth: {
        token: accessToken,
      },
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected for room status, joining room:", roomId);
      newSocket.emit("joinRoom", { roomId });
    });

    newSocket.on("connect_error", (err: any) => {
      console.error("Socket connection for room status failed:", err.message);
    });

    newSocket.on("previousRoomStatus", (payload: RoomStatus) => {
      console.log("Received previous room status:", payload);
      setRoomStatus(payload);
    });

    newSocket.on("roomStatus", (payload: RoomStatus) => {
      console.log("Received room status:", payload);
      setRoomStatus(payload);
    });

    newSocket.on("error", (error: any) => {
      console.error("Socket error (room status):", error);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl, accessToken, roomId]);

  const updateRoomStatus = useCallback(
    (status: { time: string; play: boolean }) => {
      if (socket && roomId) {
        socket.emit("updateRoomStatus", { ...status, roomId });
      }
    },
    [socket, roomId]
  );

  return { roomStatus, updateRoomStatus };
};
