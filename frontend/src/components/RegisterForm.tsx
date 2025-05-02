import React from "react";

interface RegisterFormProps {
  onClose?: () => void;
  onSwitch?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose, onSwitch }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Registration submitted");
    // Add registration logic here
    // Optionally close the modal on success
    // if (onClose) onClose();
  };

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
          required
        />
      </div>
      <button className="mt-4 text" type="submit">
        Register
      </button>
      <div className="mt-4 text">
        Already have an account? <a onClick={onSwitch}>Switch to Login</a>
      </div>
    </form>
  );
};

export default RegisterForm;
