import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./NavigationBar.module.css";
import logoSrc from "../assets/images/logo.png";
import Modal from "./Modal"; // Import the Modal component
import LoginForm from "./LoginForm"; // Import your Login form
import RegisterForm from "./RegisterForm"; // Import your Register form

const NavigationBar: React.FC = () => {
  // State to control modal visibility
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <>
      {" "}
      {/* Use a Fragment to return multiple top-level elements */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.navLogoLink}>
            {" "}
            <img
              src={logoSrc}
              alt="Online Cinema Logo"
              className={styles.navLogoImage}
            />
          </Link>
          <ul className={styles.navMenu}>
            <li className={styles.navItem}>
              {/* Use buttons to open modals instead of Links */}
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className={styles.navLink} // Reuse link styling or create new button styles
              >
                Login/Register
              </button>
            </li>
          </ul>
        </div>
      </nav>
      {/* Login Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      >
        <LoginForm
          onClose={() => setIsLoginModalOpen(false)}
          onSwitch={() => {
            setIsRegisterModalOpen(true);
            setIsLoginModalOpen(false);
          }}
        />
      </Modal>
      {/* Register Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      >
        <RegisterForm
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitch={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      </Modal>
    </>
  );
};

export default NavigationBar;
