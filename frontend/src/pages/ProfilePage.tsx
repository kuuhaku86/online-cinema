import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  // Assuming useAuth now provides update functionality and related states
  const {
    user,
    isAuthenticated,
    loading,
    // updateUser,
    // updateLoading,
    // updateError,
  } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Add state for other editable fields if available in user object, e.g.:

  // Update form state when user data changes (e.g., after initial load or successful update)
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      // Update other fields:
      // setEmail(user.email || '');
    }
  }, [user]);

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
      <form onSubmit={() => {}}>
        {/* {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )} */}
        <div className="flex items-center">
          <label
            htmlFor="profile-username"
            className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right" // Added shrink-0
          >
            Username:
          </label>
          <input
            type="text"
            id="profile-username"
            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 flex items-center">
          <label
            htmlFor="profile-email"
            className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
          >
            Email:
          </label>
          <input
            type="email"
            id="profile-email"
            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 flex items-center">
          <label
            htmlFor="profile-old-password"
            className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
          >
            Old Password:
          </label>
          <input
            type="password"
            id="profile-old-password"
            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 flex items-center">
          <label
            htmlFor="profile-new-password"
            className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
          >
            New Password:
          </label>
          <input
            type="password"
            id="profile-new-password"
            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 flex items-center">
          <label
            htmlFor="profile-confirm-new-password"
            className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
          >
            Confirm Password:
          </label>
          <input
            type="password"
            id="profile-confirm-new-password"
            className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 text"
          // disabled={registrationStatus === "pending"}
        >
          Save
        </button>
        {/* {registrationStatus === "failed" && error && (
          <p style={{ color: "red" }}>Error: {error}</p>
        )}
        {registrationMessage && (
          <p style={{ color: "green" }}>{registrationMessage}</p>
        )}
        <div className="mt-4 text">
          Already have an account? <a onClick={onSwitch}>Switch to Login</a>
        </div> */}
      </form>
    </div>
  );
};

export default ProfilePage;
