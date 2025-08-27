import React, { useEffect } from "react";
import { getSelectedVideoId } from "../features/video/videoSlice";
import { useSelector } from "react-redux";
import { useVideos } from "../hooks/useVideos";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";

const RoomPage: React.FC = () => {
  const selectedVideoId = useSelector(getSelectedVideoId);
  const { shortCode } = useParams<{ shortCode: string }>();
  const { videoStreamDetail, fetchVideoStreamDetail } = useVideos();

  useEffect(() => {
    if (selectedVideoId && shortCode) {
      fetchVideoStreamDetail(shortCode, selectedVideoId);
    }
  }, [selectedVideoId, shortCode, fetchVideoStreamDetail]);

  console.log("Selected Video", selectedVideoId);

  return (
    <div className="h-[90vh] flex flex-col">
      {/* Parent 2: Flex container for columns. Removed h-screen and min-h-screen. flex-1 will make it fill Parent 1. */}
      <div className="flex gap-5 flex-1">
        {/* Column 1 */}
        <div className="flex-3 p-5 flex flex-col justify-center items-center text-center">
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
        {/* Column 2 */}
        <div className="flex-1 p-5 flex flex-col justify-center items-center text-center"></div>
      </div>
    </div>
  );
};

export default RoomPage;
