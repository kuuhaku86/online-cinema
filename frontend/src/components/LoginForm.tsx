import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LoginFormProps {
  onClose?: () => void;
  onSwitch?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSwitch }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading, error, isAuthenticated } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    signIn({ email, password });
  };

  if (isAuthenticated) {
    return (
      <p className="mt-2 text-white text-sm">You are already logged in.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="login-email"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Email:
        </label>
        <input
          type="email"
          id="login-email"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mt-4 text">
        <label
          htmlFor="login-password"
          className="block mb-2 text-lg font-medium text-gray-900 dark:text-white"
        >
          Password:
        </label>
        <input
          type="password"
          id="login-password"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
      <button
        className="mt-4 text w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        type="submit"
        disabled={loading == "pending"}
      >
        {loading == "pending" ? "Logging in..." : "Log In"}
      </button>
      <div className="mt-4 text-center">
        Don't have an account? <a onClick={onSwitch}>Switch to Register</a>
      </div>
    </form>
  );
};

export default LoginForm;
