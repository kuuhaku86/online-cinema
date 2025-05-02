import React from "react";

interface LoginFormProps {
  onClose?: () => void;
  onSwitch?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSwitch }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Login submitted");
    // Add login logic here
  };

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
          placeholder="••••••••"
          required
        />
      </div>
      <button className="mt-4 text" type="submit">
        Log In
      </button>
      <div className="mt-4 text">
        Don't have an account? <a onClick={onSwitch}>Switch to Register</a>
      </div>
    </form>
  );
};

export default LoginForm;
