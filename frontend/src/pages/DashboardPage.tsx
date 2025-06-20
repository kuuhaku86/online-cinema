import React, { useState } from "react";
// import { useNavigate } from "react-router"; // Import useNavigate
import { createRoomApi, joinRoomApi, RoomData } from "../services/roomApi"; // Assume joinRoomApi is added to roomApi.ts

const DashboardPage: React.FC = () => {
  // const navigate = useNavigate(); // Initialize useNavigate
  const [roomCode, setRoomCode] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinRoomError, setJoinRoomError] = useState<string | null>(null);

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      alert("Please enter a room code.");
      return;
    }
    setIsJoiningRoom(true);
    setJoinRoomError(null);
    try {
      // Assume joinRoomApi exists and makes the API call
      // It should return room data or throw an error
      const joinedRoomData: RoomData = await joinRoomApi(roomCode);
      console.log("Successfully joined room:", joinedRoomData);
      // navigate(`/room/${roomCode}`);
    } catch (error) {
      if (error instanceof Error) {
        setJoinRoomError(error.message);
      } else {
        setJoinRoomError("An unknown error occurred while joining the room.");
      }
      console.error("Error joining room:", error);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    setCreateRoomError(null);
    try {
      const newRoomData: RoomData = await createRoomApi();
      console.log("Room created successfully:", newRoomData);
      // TODO: Handle successful room creation, e.g., navigate to the new room
      // For example, if the API returns a room code or ID:
      // if (newRoomData.roomCode) {
      //   history.push(`/room/${newRoomData.roomCode}`);
      // } else {
      //   alert(`Room created! ID: ${newRoomData.id || 'N/A'}`);
      // }
    } catch (error) {
      if (error instanceof Error) {
        setCreateRoomError(error.message);
      } else {
        setCreateRoomError(
          "An unknown error occurred while creating the room."
        );
      }
      console.error("Error creating room:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className="h-[90vh] flex flex-col p-4">
      {" "}
      <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>
      <div className="flex-grow grid grid-cols-12 gap-4">
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Join a Room</h2>
          <label
            htmlFor="room-code"
            className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
          >
            Room Code
          </label>
          <input
            type="text"
            id="room-code"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 w-1/2 mb-4 p-2.5 text-center dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required
          />
          <button
            className="mt-4 w-1/4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="button"
            onClick={handleJoinRoom}
            disabled={!roomCode.trim() || isJoiningRoom}
          >
            {isJoiningRoom ? "Joining..." : "Join"}
          </button>
          {joinRoomError && (
            <p className="mt-4 text-red-500">{joinRoomError}</p>
          )}
        </div>
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Start new Room</h2>
          <button
            className="mt-4 w-1/4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
          >
            {isCreatingRoom ? "Creating..." : "Create New Room"}
          </button>
          {createRoomError && (
            <p className="mt-4 text-red-500">{createRoomError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
