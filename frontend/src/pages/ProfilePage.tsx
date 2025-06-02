import React, { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";

const ProfilePage: React.FC = () => {
  const { user, updateLoading, updateError, updateProfile, clearUpdateStatus } = useProfile();

  // Local state for form inputs, initialized with user data
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);

  // Effect to update local state when user data changes (e.g., after a successful update)
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  // Effect to clear update status when the component mounts or unmounts
  useEffect(() => {
    // Clear status on mount to start fresh
    clearUpdateStatus();
    // Clear status on unmount
    return () => {
      clearUpdateStatus();
    };
  }, [clearUpdateStatus]); // Dependency array ensures this runs when clearUpdateStatus changes (unlikely, but good practice)

  // Effect to handle successful update feedback
  useEffect(() => {
    if (updateLoading === 'succeeded') {
      setIsEditing(false); // Exit editing mode on success
      // Optionally show a success message to the user (e.g., using a toast notification)
      console.log("Profile updated successfully!");
      // You might want to clear the status after a delay or user action
      // clearUpdateStatus(); // Or clear it manually later if needed
    }
  }, [updateLoading]); // Depend on updateLoading status

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare credentials to send, only including fields that have changed
    const credentialsToSend: { username?: string; email?: string } = {};
    if (username !== user?.username) {
      credentialsToSend.username = username;
    }
    if (email !== user?.email) {
      credentialsToSend.email = email;
    }

    // Only dispatch update if there are changes
    if (Object.keys(credentialsToSend).length > 0) {
      updateProfile(credentialsToSend);
    } else {
      // No changes to submit, just exit editing mode
      setIsEditing(false);
      clearUpdateStatus(); // Clear any previous state messages
    }
  };

  if (!user) {
    // Handle case where user is not logged in, maybe redirect to login or show a message
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div>
      <h1>Profile Page</h1>

      {/* Display loading, error, or success messages */}
      {updateLoading === 'pending' && <div style={{ color: 'blue' }}>Updating profile...</div>}
      {updateLoading === 'failed' && (
        <div style={{ color: 'red' }}>Error: {updateError}</div>
      )}
       {updateLoading === 'succeeded' && (
        <div style={{ color: 'green' }}>Profile updated successfully!</div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={updateLoading === 'pending'} // Disable input while loading
            />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={updateLoading === 'pending'} // Disable input while loading
            />
          </div>
          {/* Add fields for password change if needed, but handle securely */}

          <button type="submit" disabled={updateLoading === 'pending'}>
            {updateLoading === 'pending' ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => {
            // Reset form state to current user data and exit editing
            setUsername(user.username);
            setEmail(user.email);
            setIsEditing(false);
            clearUpdateStatus(); // Clear any previous error/success state
          }} disabled={updateLoading === 'pending'}>
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          {/* Add other profile details here */}
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;