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
      <h2>Register</h2>
      <div>
        <label htmlFor="register-username">Username:</label>
        <input type="text" id="register-username" required />
      </div>
      <div>
        <label htmlFor="register-email">Email:</label>
        <input type="email" id="register-email" required />
      </div>
      <div>
        <label htmlFor="register-password">Password:</label>
        <input type="password" id="register-password" required />
      </div>
      <button type="submit">Register</button>
      {onClose && (
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      )}
      <div>
        Already have an account? <a onClick={onSwitch}>Switch to Login</a>
      </div>
    </form>
  );
};

export default RegisterForm;
