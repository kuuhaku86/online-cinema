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
    // Optionally close the modal on success
    // if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <div>
        <label htmlFor="login-email">Email:</label>
        <input type="email" id="login-email" required />
      </div>
      <div>
        <label htmlFor="login-password">Password:</label>
        <input type="password" id="login-password" required />
      </div>
      <button type="submit">Log In</button>
      {/* You might add a cancel button that calls onClose */}
      {onClose && (
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      )}
      <div>
        Don't have an account? <a onClick={onSwitch}>Switch to Register</a>
      </div>
    </form>
  );
};

export default LoginForm;
