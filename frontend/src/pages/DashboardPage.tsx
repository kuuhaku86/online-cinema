import React, { useState } from "react";

const DashboardPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");

  return (
    // This div now takes full height from <main> and arranges title and panels-wrapper vertically
    <div className="h-[90vh] flex flex-col p-4">
      {" "}
      <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>
      {/* This div takes remaining vertical space and centers the row of panels */}
      <div className="flex-grow grid grid-cols-12 gap-4">
        {/* Join a Room Panel */}
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
            type="submit"
          >
            Join
          </button>
        </div>
        {/* Start new Room Panel */}
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Start new Room</h2>
          <button
            className="mt-4 w-1/4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
