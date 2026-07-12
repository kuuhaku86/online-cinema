import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

interface RegisterFormProps {
  onClose?: () => void;
  onSwitch?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose: _, onSwitch }) => {
  const { signUp, registrationStatus, error } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setRegistrationMessage("Passwords do not match");
      return;
    }

    setRegistrationMessage("");
    signUp({ username, email, password });
  };

  useEffect(() => {
    if (registrationStatus === "succeeded") {
      setRegistrationMessage("Registration successful! You can now log in.");
    }
  }, [registrationStatus]);

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="register-username"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Username:
        </label>
        <input
          type="text"
          id="register-username"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="mt-4 text">
        <label
          htmlFor="register-email"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Email:
        </label>
        <input
          type="email"
          id="register-email"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mt-4 text">
        <label
          htmlFor="register-password"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Password:
        </label>
        <input
          type="password"
          id="register-password"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="mt-4 text">
        <label
          htmlFor="register-confirm-password"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Confirm Password:
        </label>
        <input
          type="password"
          id="register-confirm-password"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="mt-4 text"
        disabled={registrationStatus === "pending"}
      >
        {registrationStatus === "pending" ? "Registering..." : "Register"}
      </button>
      {registrationStatus === "failed" && error && (
        <p style={{ color: "red" }}>Error: {error}</p>
      )}
      {registrationMessage && (
        <p style={{ color: "green" }}>{registrationMessage}</p>
      )}
      <div className="mt-4 text">
        Already have an account? <a onClick={onSwitch}>Switch to Login</a>
      </div>
    </form>
  );
};

export default RegisterForm;
