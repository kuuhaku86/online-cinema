import React, { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";

const ProfilePage: React.FC = () => {
  const { user, updateLoading, updateError, updateProfile, clearUpdateStatus } =
    useProfile();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setPassword("");
      setConfirmPassword("");
      setOldPassword("");
    }
  }, [user]);

  useEffect(() => {
    clearUpdateStatus();
    return () => {
      clearUpdateStatus();
    };
  }, [clearUpdateStatus]);

  useEffect(() => {
    if (updateLoading === "succeeded") {
      setIsEditing(false);
      // Optionally show a success message to the user (e.g., using a toast notification)
      console.log("Profile updated successfully!");
      clearUpdateStatus();
      setPassword("");
      setConfirmPassword("");
      setOldPassword("");
    }
  }, [updateLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const credentialsToSend: {
      username?: string;
      email?: string;
      newPassword?: string;
      oldPassword?: string;
    } = {};
    credentialsToSend.username = username;
    credentialsToSend.email = email;
    if (password.length > 0) {
      if (password !== confirmPassword) {
        setIsEditing(false);
        clearUpdateStatus();
        return;
      }
      credentialsToSend.newPassword = password;
      credentialsToSend.oldPassword = oldPassword;
    }
    if (oldPassword.length > 0) {
      credentialsToSend.oldPassword = oldPassword;
    }

    if (Object.keys(credentialsToSend).length > 0) {
      updateProfile(credentialsToSend);
    } else {
      setIsEditing(false);
      clearUpdateStatus();
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto p-8 mt-5 max-w-lg">
      <h1 className="text-4xl font-bold text-center mb-8 dark:text-white">
        Profile Page
      </h1>

      {updateLoading === "pending" && (
        <div style={{ color: "blue" }}>Updating profile...</div>
      )}
      {updateLoading === "failed" && (
        <div style={{ color: "red" }}>Error: {updateError}</div>
      )}
      {updateLoading === "succeeded" && (
        <div style={{ color: "green" }}>Profile updated successfully!</div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center">
            <label
              htmlFor="username"
              className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
            >
              Username:
            </label>
            <input
              id="username"
              type="text"
              className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={updateLoading === "pending"}
            />
          </div>
          <div className="mt-4 flex items-center">
            <label
              htmlFor="email"
              className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
            >
              Email:
            </label>
            <input
              id="email"
              type="email"
              className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={updateLoading === "pending"}
            />
          </div>
          <div className="mt-4 flex items-center">
            <label
              htmlFor="old-password"
              className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
            >
              Old Password:
            </label>
            <input
              type="password"
              id="old-password"
              className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={updateLoading === "pending"}
              required={password.length > 0}
            />
          </div>
          <div className="mt-4 flex items-center">
            <label
              htmlFor="new-password"
              className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
            >
              New Password:
            </label>
            <input
              type="password"
              id="new-password"
              className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={updateLoading === "pending"}
            />
          </div>
          <div className="mt-4 flex items-center">
            <label
              htmlFor="confirm-new-password"
              className="w-48 mr-4 text-lg font-medium text-gray-900 dark:text-white shrink-0 text-right"
            >
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirm-new-password"
              className="flex-grow bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={updateLoading === "pending"}
              required={password.length > 0}
            />
          </div>

          <div className="mt-2">
            <button
              type="submit"
              className="mr-2"
              disabled={updateLoading === "pending"}
            >
              {updateLoading === "pending" ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername(user.username);
                setEmail(user.email);
                setOldPassword("");
                setPassword("");
                setConfirmPassword("");
                setIsEditing(false);
                clearUpdateStatus();
              }}
              disabled={updateLoading === "pending"}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
