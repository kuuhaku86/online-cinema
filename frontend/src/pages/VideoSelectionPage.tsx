import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { uploadVideoApi } from "../services/videosApi";

const VideoSelectionPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    console.log("Uploading file:", selectedFile.name);
    try {
      await uploadVideoApi(selectedFile);
      setUploadSuccess(`Successfully uploaded ${selectedFile.name}!`);
      setSelectedFile(null);
    } catch (error) {
      setUploadError("Failed to upload video. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
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
            <p className="mt-2 text-green-500">{uploadSuccess}</p>
          )}
        </div>
        <div className="border-2 rounded-lg border-red-700 col-span-6 h-full p-4 flex flex-col justify-center items-center text-center">
          <h2 className="text-3xl font-bold mb-6">Select Existing Video</h2>
          <p className="text-gray-700 dark:text-gray-300">
            (This section will allow you to browse and select videos from your
            library.)
          </p>
          {/* Placeholder for video list/selection component */}
          <div className="mt-4 p-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-md text-center text-gray-500 dark:text-gray-400">
            Video list placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionPage;
