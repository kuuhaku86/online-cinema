import React from "react";

const RoomPage: React.FC = () => {
  return (
    <div className="h-[90vh] flex flex-col">
      {/* Parent 2: Flex container for columns. Removed h-screen and min-h-screen. flex-1 will make it fill Parent 1. */}
      <div className="flex gap-5 flex-1">
        {/* Column 1 */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center text-center"></div>
        {/* Column 2 */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center text-center">
          <p className="text-8xl font-bold text-gray-800 dark:text-white mb-4">
            Test
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
