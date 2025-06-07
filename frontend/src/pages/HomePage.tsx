import React from "react";
import LandingPage from "./LandingPage";
import { useAuth } from "../hooks/useAuth";
import DashboardPage from "./DashboardPage";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <DashboardPage />;

  return <LandingPage />;
};

export default HomePage;
