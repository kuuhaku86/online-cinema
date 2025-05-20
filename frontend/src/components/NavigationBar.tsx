import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./NavigationBar.module.css";
import logoSrc from "../assets/images/logo.png";
import Modal from "./Modal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { FaUserCircle, FaSignOutAlt, FaSignInAlt } from "react-icons/fa"; // Import icons

const NavigationBar: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();

  return (
    <>
      {" "}
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
            {isAuthenticated ? (
              <>
                {user && user.username && (
                  <li className={`${styles.navItem}`}>
                    <Link
                      to="/profile"
                      className={`${styles.navLink} ${styles.navButtonWithIcon} rounded-md`}
                    >
                      <FaUserCircle className={styles.navIcon} /> Profile
                    </Link>
                  </li>
                )}
                <li className={styles.navItem}>
                  <button
                    onClick={signOut}
                    className={`${styles.navLink} ${styles.navButtonWithIcon} rounded-md`}
                  >
                    <FaSignOutAlt className={styles.navIcon} /> Logout
                  </button>
                </li>
              </>
            ) : (
              <li className={styles.navItem}>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`${styles.navLink} ${styles.navButtonWithIcon}`}
                >
                  <FaSignInAlt className={styles.navIcon} /> Login/Register
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
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
