import React, { useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams

const VideoSelectionPage: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>(); // Get shortCode from URL params
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

    // Placeholder for actual upload logic
    console.log("Uploading file:", selectedFile.name);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setUploadSuccess(`Successfully uploaded ${selectedFile.name}!`);
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (error) {
      setUploadError("Failed to upload video. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 mt-5 max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        Upload or Select Video for Room: {shortCode}
      </h1>

      <div className="mb-8 p-6 border border-gray-300 dark:border-gray-700 rounded-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Upload New Video
        </h2>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900 dark:file:text-blue-100 dark:hover:file:bg-blue-800"
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

      <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Select Existing Video
        </h2>
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
  );
};

export default VideoSelectionPage;
