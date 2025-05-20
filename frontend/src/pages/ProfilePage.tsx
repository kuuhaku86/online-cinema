import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading === "pending") {
    return (
      <div className="container mx-auto p-4 text-center dark:text-white">
        Loading profile...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home if not authenticated, as a safeguard
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center dark:text-white">
        User data not available. Please try logging in again.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 mt-5 max-w-lg">
      <h1 className="text-4xl font-bold text-center mb-8 dark:text-white">
        User Profile
      </h1>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <div className="mb-6">
          <p className="text-md font-semibold text-gray-600 dark:text-gray-400">
            Username
          </p>
          <p className="text-xl text-gray-900 dark:text-white">
            {user.username}
          </p>
        </div>
        {/* You can add more user details here, e.g., email, if available and desired */}
      </div>
    </div>
  );
};

export default ProfilePage;
