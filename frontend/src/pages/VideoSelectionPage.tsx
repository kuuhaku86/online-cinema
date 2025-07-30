import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { VideoData } from "../services/videosApi";
import { useVideos } from "../hooks/useVideos";

const VideoSelectionPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  const {
    videos,
    loading,
    error: fetchError,
    uploadVideo,
    uploading,
    uploadError,
    uploadSuccess,
    clearUploadStatus,
  } = useVideos();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      clearUploadStatus();
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadVideo(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.log("Error uploading video:", error);
    }
  };

  return (
    <div className="h-[90vh] flex flex-col p-4">
      {" "}
      <h1 className="text-2xl font-bold mb-4 text-center">
        Upload or Select Video for Room: {shortCode}
      </h1>
      <div className="flex-grow grid grid-cols-12 gap-4">
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Upload New Video</h2>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-red-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-red-500 dark:file:text-blue-100 dark:hover:file:bg-gray-700"
          />
          {selectedFile && (
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              Selected file: {selectedFile.name}
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Video"}
          </button>
          {uploadError && <p className="mt-2 text-red-500">{uploadError}</p>}
          {uploadSuccess && (
            <p className="mt-2 text-green-500">Video uploaded successfully!</p>
          )}
        </div>
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Select Existing Video</h2>
          <p className="text-gray-700 dark:text-gray-300">
            (This section will allow you to browse and select videos from your
            library.)
          </p>
          <div className="static">
            <button
              id="dropdownUsersButton"
              data-dropdown-toggle="dropdownUsers"
              data-dropdown-placement="bottom"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              type="button"
              onClick={() => setDropdownVisible((prev) => !prev)}
            >
              {selectedVideo?.fileName || "Select Video"}
              <svg
                className="w-2.5 h-2.5 ms-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>
            <div
              id="dropdownUsers"
              className={`${
                dropdownVisible ? "block" : "hidden"
              } absoulute z-10 bg-white rounded-lg shadow-sm w-60 dark:bg-gray-700`}
            >
              <ul
                className="h-48 py-2 overflow-y-auto text-gray-700 dark:text-gray-200"
                aria-labelledby="dropdownUsersButton"
              >
                {loading && <li className="px-4 py-2">Loading...</li>}
                {fetchError && (
                  <li className="px-4 py-2 text-red-500">{fetchError}</li>
                )}
                {!loading &&
                  !fetchError &&
                  videos.map((video) => (
                    <li key={video.id}>
                      <a
                        href="#"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        onClick={() => {
                          setSelectedVideo(video);
                          setDropdownVisible(false);
                        }}
                      >
                        {video.fileName}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionPage;
