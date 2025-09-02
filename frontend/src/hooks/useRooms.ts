import { useState, useCallback } from "react";
import {
  createRoomApi,
  joinRoomApi,
  RoomData,
  startRoomApi,
} from "../services/roomsApi";

export const useRooms = () => {
  // State for creating a room
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);

  // State for joining a room
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinRoomError, setJoinRoomError] = useState<string | null>(null);

  const createRoom = useCallback(async (): Promise<RoomData> => {
    setIsCreatingRoom(true);
    setCreateRoomError(null);
    try {
      const newRoomData = await createRoomApi();
      return newRoomData;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the room.";
      setCreateRoomError(message);
      console.error("Error creating room:", error);
      throw error;
    } finally {
      setIsCreatingRoom(false);
    }
  }, []);

  const joinRoom = useCallback(async (shortCode: string): Promise<RoomData> => {
    setIsJoiningRoom(true);
    setJoinRoomError(null);
    try {
      const joinedRoomData = await joinRoomApi(shortCode);
      return joinedRoomData;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while joining the room.";
      setJoinRoomError(message);
      console.error("Error joining room:", error);
      throw error;
    } finally {
      setIsJoiningRoom(false);
    }
  }, []);

  const startRoom = useCallback(
    async (roomId: string, videoId: string): Promise<RoomData> => {
      setIsJoiningRoom(true);
      setJoinRoomError(null);
      try {
        const startedRoomData = await startRoomApi(roomId, videoId);
        return startedRoomData;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unknown error occurred while starting the room.";
        setJoinRoomError(message);
        console.error("Error joining room:", error);
        throw error;
      } finally {
        setIsJoiningRoom(false);
      }
    },
    []
  );

  return {
    isCreatingRoom,
    createRoomError,
    createRoom,
    isJoiningRoom,
    joinRoomError,
    joinRoom,
    startRoom,
  };
};
