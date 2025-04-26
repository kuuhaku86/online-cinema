import React from "react";
import { Link } from "react-router-dom";
import styles from "./NavigationBar.module.css";
import logoSrc from "../assets/images/logo.png";

const NavigationBar: React.FC = () => {
  return (
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
            <Link to="/login" className={styles.navLink}>
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavigationBar;
